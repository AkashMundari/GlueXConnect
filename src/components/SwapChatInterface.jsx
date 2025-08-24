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
        "Hello! I'm your AI assistant. I can help you swap tokens on the HyperEVM chain powered by Glue X's router api. Just tell me what tokens you'd like to swap and the amount!",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // 🔑 Groq client
  const llm = new ChatGroq({
    apiKey: "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", // store safely in .env
    model: "llama3-8b-8192",
  });

  const uniquePID =
    "8abfa3e8386ac5a7e351853597ec35d7963e747eed2865222c33c1573958cf12";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    inputToken,
    outputToken,
    inputAmount,
    chainID,
  }) => {
    const url = "https://router.gluex.xyz/v1/price";

    const payload = {
      chainID: chainID,
      inputToken,
      outputToken,
      inputAmount: inputAmount * 10 ** 18, // scale amount
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
      console.log(data);
      return {
        inputAmount,
        outputAmount: data.result.outputAmount / 10 ** 6,
        inputToken,
        outputToken,
      };
    } catch (error) {
      console.error("Swap API Error:", error);
      return null;
    }
  };

  // 🔥 Replace mock AI with Groq LangChain
  // 🔥 Updated AI Processing with Structured Extraction
  const processWithAI = async (message) => {
    try {
      // First step: Ask model ONLY to detect swaps
      const detection = await llm.invoke([
        new HumanMessage(
          `You are a strict JSON detector. 
        If the user is asking for a token swap, return ONLY a JSON object in this format:
        {"inputToken":"0x...", "outputToken":"0x...", "inputAmount":"a_number", chainID:"like hyperevm,arbitrum,avalanche,base,berachain,bnb,ethereum,gnosis,optimism,polygon,unichain"}

        example request : swap 1 0x455e53cbb86018ac2b8092fdcd39d8444affc3f6 for 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48 on the Ethereum chain

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

      // If swap detected → return swap intent
      if (
        parsed.inputToken &&
        parsed.outputToken &&
        parsed.inputAmount &&
        parsed.chainID
      ) {
        return {
          intent: "swap",
          response: "Got it! Let me fetch a quote...",
          swapData: {
            inputToken: parsed.inputToken,
            outputToken: parsed.outputToken,
            inputAmount: parseFloat(parsed.inputAmount),
            chainID: parsed.chainID,
          },
        };
      }

      // Otherwise → ask model for a normal reply
      const normalReply = await llm.invoke([new HumanMessage(message)]);
      return {
        intent: "general",
        response: normalReply.content,
      };
    } catch (error) {
      console.error("Groq AI Error:", error);
      return {
        intent: "error",
        response: "⚠️ Error connecting to Groq AI. Please try again later.",
      };
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const userMessage = inputMessage.trim();
    setInputMessage("");
    addMessage("user", userMessage);
    setIsLoading(true);
    try {
      const aiResponse = await processWithAI(userMessage);

      if (aiResponse.intent === "swap" && isConnected) {
        const quote = await fetchSwapQuote(aiResponse.swapData);
        if (quote) {
          addMessage("bot", "Here's your swap quote:", quote);
        } else {
          addMessage("bot", "⚠️ Failed to fetch swap quote. Try again.");
        }
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

  const SwapQuoteCard = ({ swapData }) => (
    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mt-3 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <ArrowUpDown className="w-4 h-4 text-indigo-600" />
        <span className="font-medium text-indigo-800">Swap Quote</span>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <p className="text-gray-600">Input Token: {swapData.inputToken}</p>
          <p className="text-gray-600">Input Amount:{swapData.inputAmount}</p>
        </div>
        <div>
          <p className="text-gray-600">Output Token:{swapData.outputToken}</p>
          <p className="text-gray-600">
            Output Amount:~{swapData.outputAmount}
          </p>
        </div>

        <div>
          <p className="text-gray-600">
            1 ≈ {swapData.outputAmount / swapData.inputAmount}
          </p>
        </div>
      </div>

      <button className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 shadow transition">
        <CheckCircle className="w-4 h-4" /> Execute Swap
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-mono">
      {/* Header */}
      <nav className="bg-white/90 backdrop-blur border-b border-gray-200 px-6 py-4 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-800">
            🤖 AI Swap Assistant
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
