/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Wallet,
  LogOut,
  Bot,
  User,
  ArrowUpDown,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

// LangChain + Groq
import { ChatGroq } from "@langchain/groq";
import { HumanMessage } from "@langchain/core/messages";

const SwapChatInterface = () => {
  // Wallet state
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState("");

  // Chat state
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      content:
        "Hello! I'm your AI assistant. I can help you swap tokens powered by Glue X's router api. Just tell me what tokens you'd like to swap and the amount!",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // 🔑 Groq client (move key to env in production)
  const llm = new ChatGroq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    model: "llama3-8b-8192",
  });

  // CryptoRank API key
  const cryptoRankApiKey = import.meta.env.VITE_CRYPTORANK_API_KEY;

  const uniquePID = import.meta.env.VITE_GLUEX_PID;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ✅ Moralis API integration (fetch metadata when addresses are given)
  const getTokenMetadataFromMoralis = async (address, chainID) => {
    try {
      const response = await fetch(
        `https://deep-index.moralis.io/api/v2.2/erc20/metadata?chain=${chainID}&addresses%5B0%5D=${address}`,
        {
          headers: {
            "X-API-Key": import.meta.env.VITE_MORALIS_API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Moralis API failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(data[0]);
      return {
        address: data[0].address,
        decimals: parseInt(data[0].decimals, 10),
        symbol: data[0].symbol,
        blockchain: chainID,
      };
    } catch (error) {
      console.error("Moralis API Error:", error);
      throw error;
    }
  };

  // ✅ CryptoRank API integration (fallback when only symbols provided)
  const getTokenContractAddress = async (symbol, blockchainKey) => {
    try {
      const mapUrl = "https://api.cryptorank.io/v2/currencies/map";
      const mapResponse = await fetch(mapUrl, {
        method: "GET",
        headers: {
          "X-Api-Key": cryptoRankApiKey,
        },
      });

      if (!mapResponse.ok) {
        throw new Error(`CryptoRank map API failed: ${mapResponse.statusText}`);
      }

      const mapData = await mapResponse.json();
      const cryptoInfo = mapData.data.find(
        (currency) => currency.symbol?.toUpperCase() === symbol.toUpperCase()
      );

      if (!cryptoInfo) {
        throw new Error(`No cryptocurrency found with symbol "${symbol}"`);
      }

      const cryptoId = cryptoInfo.id;

      const currencyUrl = `https://api.cryptorank.io/v2/currencies/${cryptoId}`;
      const currencyResponse = await fetch(currencyUrl, {
        method: "GET",
        headers: {
          "X-Api-Key": cryptoRankApiKey,
        },
      });

      if (!currencyResponse.ok) {
        throw new Error(
          `CryptoRank currency API failed: ${currencyResponse.statusText}`
        );
      }

      const currencyData = await currencyResponse.json();

      if (currencyData.data && currencyData.data.contracts) {
        const filteredContracts = currencyData.data.contracts.filter(
          (contract) =>
            contract.platform &&
            contract.platform.key.toLowerCase() === blockchainKey.toLowerCase()
        );

        if (filteredContracts.length > 0) {
          return {
            address: filteredContracts[0].address,
            decimals: filteredContracts[0].decimals,
            symbol: symbol.toUpperCase(),
            blockchain: filteredContracts[0].platform.name,
          };
        } else {
          throw new Error(
            `No contract found for ${symbol} on ${blockchainKey}
            
It might be that the blockchain or token is not supported by CryptoRank.
            
You can try to use the token contract addresses for example : "swap 1 <input_token_contract_address> to <output_token_contract_address> on <chain_name>"`
          );
        }
      } else {
        throw new Error(`No contract data found for ${symbol}`);
      }
    } catch (error) {
      console.error("CryptoRank API Error:", error);
      throw error;
    }
  };

  // Wallet functions
  const handleConnectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setUserAddress(accounts[0]);
        setIsConnected(true);

        addMessage(
          "bot",
          `✅ Wallet connected: ${accounts[0].slice(
            0,
            6
          )}...${accounts[0].slice(-4)}. Now you can request token swaps!`
        );
      } catch (error) {
        console.error("Error connecting wallet:", error);
        addMessage("bot", "❌ Failed to connect wallet. Please try again.");
      }
    } else {
      alert("MetaMask is not installed. Please install MetaMask to connect.");
    }
  };

  const handleDisconnectWallet = () => {
    setIsConnected(false);
    setUserAddress("");
    addMessage(
      "bot",
      "👋 Wallet disconnected. Connect again to perform swaps."
    );
  };

  // Chat functions
  const addMessage = (type, content, swapData = null) => {
    const newMessage = {
      id: Date.now(),
      type,
      content,
      timestamp: new Date(),
      swapData,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  // 🔥 Swap API integration
  const fetchSwapQuote = async ({
    inputTokenAddress,
    outputTokenAddress,
    inputAmount,
    inputTokenDecimals,
    outputTokenDecimals,
    chainID,
  }) => {
    const url = "https://router.gluex.xyz/v1/quote";

    const payload = {
      chainID: chainID,
      inputToken: inputTokenAddress,
      outputToken: outputTokenAddress,
      inputAmount: inputAmount * 10 ** inputTokenDecimals,
      orderType: "SELL",
      userAddress,
      outputReceiver: userAddress,
      uniquePID,
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "x-api-key": "qfL5nAvuIAgsBB4vBPkpy6WL0MctJWVK",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      console.log("Quote Response:", data);
      return {
        inputAmount,
        outputAmount: data.result.outputAmount / 10 ** outputTokenDecimals,
        inputTokenAddress,
        outputTokenAddress,
        inputTokenDecimals,
        outputTokenDecimals,
        apiResponse: data.result,
        chainID,
      };
    } catch (error) {
      console.error("Swap API Error:", error);
      return null;
    }
  };

  // Execute swap transaction (unchanged)
  const executeSwap = async (swapData) => {
    try {
      addMessage("bot", "🔄 Initiating swap transaction...");

      const { apiResponse } = swapData;

      if (!apiResponse || !apiResponse.router || !apiResponse.calldata) {
        throw new Error("Invalid swap data received from API");
      }

      const transactionParams = {
        from: userAddress,
        to: apiResponse.router,
        data: apiResponse.calldata,
        value: apiResponse.value || "0x0",
        gas: apiResponse.computationUnits
          ? `0x${apiResponse.computationUnits.toString(16)}`
          : "0x1E8480",
      };

      console.log("Transaction Params:", transactionParams);

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [transactionParams],
      });

      addMessage(
        "bot",
        `✅ Transaction submitted successfully!\n\nTransaction Hash: ${txHash}\n\nYour swap is being processed. Please wait for confirmation on the blockchain.`
      );

      const waitForConfirmation = async () => {
        try {
          let receipt = null;
          let attempts = 0;
          const maxAttempts = 30;

          while (!receipt && attempts < maxAttempts) {
            try {
              receipt = await window.ethereum.request({
                method: "eth_getTransactionReceipt",
                params: [txHash],
              });
            } catch (e) {
              console.log(e);
            }

            if (!receipt) {
              await new Promise((resolve) => setTimeout(resolve, 10000));
              attempts++;
            }
          }

          if (receipt) {
            if (receipt.status === "0x1") {
              addMessage(
                "bot",
                `🎉 Swap completed successfully!\n\nTransaction confirmed in block ${parseInt(
                  receipt.blockNumber,
                  16
                )}`
              );
            } else {
              addMessage(
                "bot",
                "❌ Transaction failed. Please check the transaction hash on a blockchain explorer."
              );
            }
          } else {
            addMessage(
              "bot",
              "⏳ Transaction is taking longer than expected. Please check the transaction hash on a blockchain explorer."
            );
          }
        } catch (error) {
          console.error("Error waiting for confirmation:", error);
        }
      };

      waitForConfirmation();
    } catch (error) {
      console.error("Transaction Error:", error);

      let errorMessage = "❌ Transaction failed: ";
      if (error.code === 4001) {
        errorMessage += "Transaction was rejected by user.";
      } else if (error.code === -32603) {
        errorMessage += "Internal error. Please try again.";
      } else {
        errorMessage += error.message || "Unknown error occurred.";
      }

      addMessage("bot", errorMessage);
    }
  };

  // 🔥 AI Processing
  const processWithAI = async (message) => {
    try {
      const detection = await llm.invoke([
        new HumanMessage(
          `You are a strict JSON detector.
If the user is asking for a token swap, return ONLY a JSON object in this format:

- If symbols are provided:
{"inputTokenSymbol":"TOKEN_SYMBOL", "outputTokenSymbol":"TOKEN_SYMBOL", "inputAmount":"a_number", "chainID":"like hyperevm,arbitrum,avalanche,base,berachain,bnb,ethereum,gnosis,optimism,polygon,unichain"}

- If contract addresses are provided:
{"inputTokenAddress":"0x...", "outputTokenAddress":"0x...", "inputAmount":"a_number", "chainID":"like hyperevm,arbitrum,avalanche,base,berachain,bnb,ethereum,gnosis,optimism,polygon,unichain"}

example request using symbols: swap 1 kHYPE for USOL on the hyperevm chain
expected response: {"inputTokenSymbol":"kHYPE", "outputTokenSymbol":"USOL", "inputAmount":"1", "chainID":"hyperevm"}

example request using addresses: swap 1 0x1111... for 0x2222... on arbitrum
expected response: {"inputTokenAddress":"0x1111...", "outputTokenAddress":"0x2222...", "inputAmount":"1", "chainID":"arbitrum"}

If it's NOT a swap request, return exactly: {"swap": false}`
        ),
        new HumanMessage(message),
      ]);

      let parsed;
      try {
        parsed = JSON.parse(detection.content);
      } catch {
        parsed = { swap: false };
      }

      if (
        parsed.inputAmount &&
        ((parsed.inputTokenSymbol &&
          parsed.outputTokenSymbol &&
          parsed.chainID) ||
          (parsed.inputTokenAddress &&
            parsed.outputTokenAddress &&
            parsed.chainID))
      ) {
        return {
          intent: "swap",
          response: "Got it! Let me fetch the token details and quote...",
          swapData: parsed,
        };
      }

      const normalReply = await llm.invoke([new HumanMessage(message)]);
      return {
        intent: "general",
        response: normalReply.content,
      };
    } catch (error) {
      console.error("Groq AI Error:", error);
      return {
        intent: "error",
        response: "⚠ Error connecting to Groq AI. Please try again later.",
      };
    }
  };

  // Handle user message
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const userMessage = inputMessage.trim();
    setInputMessage("");
    addMessage("user", userMessage);
    setIsLoading(true);
    try {
      const aiResponse = await processWithAI(userMessage);

      if (aiResponse.intent === "swap" && isConnected) {
        try {
          let inputTokenData, outputTokenData;

          // ✅ If addresses provided → use Moralis API separately
          if (aiResponse.swapData.inputTokenAddress) {
            addMessage("bot", "🔍 Fetching token metadata from Moralis...");
            inputTokenData = await getTokenMetadataFromMoralis(
              aiResponse.swapData.inputTokenAddress,
              aiResponse.swapData.chainID
            );
            outputTokenData = await getTokenMetadataFromMoralis(
              aiResponse.swapData.outputTokenAddress,
              aiResponse.swapData.chainID
            );
          } else {
            // ✅ Else use CryptoRank API
            addMessage("bot", "🔍 Fetching token contract addresses...");
            [inputTokenData, outputTokenData] = await Promise.all([
              getTokenContractAddress(
                aiResponse.swapData.inputTokenSymbol,
                aiResponse.swapData.chainID
              ),
              getTokenContractAddress(
                aiResponse.swapData.outputTokenSymbol,
                aiResponse.swapData.chainID
              ),
            ]);

            addMessage(
              "bot",
              `✅ Found contracts:\n• ${inputTokenData.symbol}: ${inputTokenData.address}\n• ${outputTokenData.symbol}: ${outputTokenData.address}`
            );
          }

          const quote = await fetchSwapQuote({
            inputTokenAddress: inputTokenData.address,
            outputTokenAddress: outputTokenData.address,
            inputAmount: parseFloat(aiResponse.swapData.inputAmount),
            inputTokenDecimals: inputTokenData.decimals,
            outputTokenDecimals: outputTokenData.decimals,
            chainID: aiResponse.swapData.chainID,
          });

          if (quote) {
            const enhancedQuote = {
              ...quote,
              inputTokenSymbol: inputTokenData.symbol,
              outputTokenSymbol: outputTokenData.symbol,
              inputTokenBlockchain: inputTokenData.blockchain,
              outputTokenBlockchain: outputTokenData.blockchain,
            };
            addMessage("bot", "Here's your swap quote:", enhancedQuote);
          } else {
            addMessage("bot", "⚠ Failed to fetch swap quote. Try again.");
          }
        } catch (error) {
          console.error("Token lookup error:", error);
          addMessage("bot", `❌ Error fetching token data: ${error.message}`);
        }
      } else if (aiResponse.intent === "swap" && !isConnected) {
        addMessage(
          "bot",
          "⚠ Please connect your wallet first to perform swaps."
        );
      } else {
        addMessage("bot", aiResponse.response);
      }
    } catch (error) {
      addMessage("bot", "⚠ Error processing your request. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const SwapQuoteCard = ({ swapData }) => {
    const [isExecuting, setIsExecuting] = useState(false);

    const handleExecuteSwap = async () => {
      setIsExecuting(true);
      try {
        await executeSwap(swapData);
      } catch (error) {
        console.error("Execute swap error:", error);
      } finally {
        setIsExecuting(false);
      }
    };

    return (
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mt-3 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <ArrowUpDown className="w-4 h-4 text-indigo-600" />
          <span className="font-medium text-indigo-800">Swap Quote</span>
        </div>

        <div className="space-y-2 text-sm">
          <div>
            <p className="text-gray-600">
              Input Token: {swapData.inputTokenSymbol || "Unknown"}
            </p>
            <p className="text-gray-600">
              Input Amount: {swapData.inputAmount}
            </p>
          </div>
          <div>
            <p className="text-gray-600">
              Output Token: {swapData.outputTokenSymbol || "Unknown"}
            </p>
            <p className="text-gray-600">
              Output Amount: ~{swapData.outputAmount}
            </p>
          </div>

          <div>
            <p className="text-gray-600">
              Exchange Rate: 1 {swapData.inputTokenSymbol} ≈{" "}
              {(swapData.outputAmount / swapData.inputAmount).toFixed(6)}{" "}
              {swapData.outputTokenSymbol}
            </p>
          </div>
        </div>

        <button
          onClick={handleExecuteSwap}
          disabled={isExecuting || !swapData.apiResponse}
          className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 shadow transition"
        >
          {isExecuting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Processing...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" /> Execute Swap
            </>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-mono">
      {/* Header */}
      <nav className="bg-white/90 backdrop-blur border-b border-gray-200 px-6 py-4 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-800">
            🤖 GlueX Connect
          </div>
          <div>
            {isConnected ? (
              <div className="flex items-center gap-3">
                <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow font-mono text-sm">
                  <Wallet className="w-4 h-4 inline mr-1" />
                  {`${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`}
                </div>
                <button
                  onClick={handleDisconnectWallet}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition shadow-sm"
                >
                  <LogOut className="w-4 h-4 inline mr-1" /> Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectWallet}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2 rounded-lg shadow transition"
              >
                <Wallet className="w-4 h-4 inline mr-1" /> Connect Wallet
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.type === "bot" && (
                <div className="w-9 h-9 bg-indigo-500 rounded-full flex items-center justify-center shadow">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[70%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                  message.type === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-gray-200"
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.swapData && (
                  <SwapQuoteCard swapData={message.swapData} />
                )}
                <div className="text-xs opacity-70 mt-2 text-right">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
              {message.type === "user" && (
                <div className="w-9 h-9 bg-gray-400 rounded-full flex items-center justify-center shadow">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-9 h-9 bg-indigo-500 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-gray-200 px-4 py-3 rounded-xl shadow-sm text-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                AI is thinking...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200 p-4 shadow-sm">
          <div className="flex gap-3">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 p-3 border border-gray-300 rounded-lg resize-none outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              rows="1"
              style={{ minHeight: "48px", maxHeight: "120px" }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white p-3 rounded-lg shadow transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {!isConnected && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-yellow-700">
                Connect your wallet to perform swaps
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SwapChatInterface;
