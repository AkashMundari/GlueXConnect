import React, { useState } from "react";
import {
  ChevronDown,
  Search,
  ArrowUpDown,
  X,
  Wallet,
  LogOut,
} from "lucide-react";

// Mock token data - in real app this would come from an API

const SwapForm = () => {
  // Initialize all state with proper default values to avoid controlled/uncontrolled input errors
  const [inputToken, setInputToken] = useState("");
  const [outputToken, setOutputToken] = useState("");
  const [inputAmount, setInputAmount] = useState("");
  const [outputAmount, setOutputAmount] = useState("");
  const [orderType, setOrderType] = useState("SELL");
  const [userAddress, setUserAddress] = useState("");
  const [outputReceiver, setOutputReceiver] = useState("");
  const uniquePID =
    "8abfa3e8386ac5a7e351853597ec35d7963e747eed2865222c33c1573958cf12";
  const [isConnected, setIsConnected] = useState(false);

  const handleSwapTokens = () => {
    const temp = inputToken;
    setInputToken(outputToken);
    setOutputToken(temp);
  };

  const handleConnectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setUserAddress(accounts[0]);
        setOutputReceiver(accounts[0]); // Set output receiver to user address by default
        setIsConnected(true);
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      alert(
        "MetaMask is not installed. Please install MetaMask to connect your wallet."
      );
    }
  };

  const handleDisconnectWallet = () => {
    setIsConnected(false);
    setUserAddress("");
    setOutputReceiver("");
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (
      !inputToken ||
      !outputToken ||
      !inputAmount ||
      !userAddress ||
      !uniquePID
    ) {
      alert("Please fill in all required fields");
      return;
    }

    const url = "https://router.gluex.xyz/v1/price";

    // Create proper JSON payload
    const payload = {
      chainID: "hyperevm",
      inputToken: inputToken,
      outputToken: outputToken,
      inputAmount: inputAmount * 10 ** 18,
      orderType: orderType,
      userAddress: userAddress,
      outputReceiver: outputReceiver || userAddress, // Use userAddress as fallback
      uniquePID: uniquePID,
    };

    const options = {
      method: "POST",
      headers: {
        "x-api-key": "qfL5nAvuIAgsBB4vBPkpy6WL0MctJWVK",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload), // Use JSON.stringify instead of template literal
    };

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setOutputAmount(data.result.outputAmount);
      console.log("Success:", data);
      console.log(data.result.router);

      // Handle successful response here
      // You might want to show success message or update UI
    } catch (error) {
      console.error("Error:", error);

      // Handle different types of errors
      if (
        error.name === "TypeError" &&
        error.message.includes("Failed to fetch")
      ) {
        alert(
          "Network error: Unable to connect to the server. This might be due to CORS policy or network issues."
        );
      } else {
        alert(`Request failed: ${error.message}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="text-xl font-bold text-gray-800">LOGO HERE</div>
            <button className="text-gray-600 hover:text-gray-800 transition-colors">
              How it works
            </button>
          </div>
          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="flex items-center gap-2">
                <div className="bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  {`${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`}
                </div>
                <button
                  onClick={handleDisconnectWallet}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectWallet}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center pt-12 px-4">
        <div className="bg-white rounded-xl p-6 shadow-md max-w-md w-full border border-gray-200">
          <div className="space-y-4">
            {/* Order Type Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setOrderType("SELL")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  orderType === "SELL"
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Sell Order
              </button>
              <button
                type="button"
                onClick={() => setOrderType("BUY")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  orderType === "BUY"
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Buy Order
              </button>
            </div>

            {/* Input Token Section */}
            <div className="space-y-2">
              <label className="block text-sm text-gray-600">
                Input Token Address
              </label>
              <input
                type="text"
                placeholder="Enter Input Token Address"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500"
              />
            </div>

            {/* Swap Direction Button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleSwapTokens}
                className="bg-white border-2 border-gray-300 rounded-full w-10 h-10 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors duration-200"
              >
                <ArrowUpDown className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Output Token Section */}
            <div className="space-y-2">
              <label className="block text-sm text-gray-600">
                Output Token Address
              </label>
              <input
                type="text"
                placeholder="Enter Output Token Address"
                value={outputToken}
                onChange={(e) => setOutputToken(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500"
              />
            </div>

            {/* Advanced Settings */}
            <div className="space-y-4 pt-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Input Amount *
                </label>
                <input
                  type="number"
                  placeholder="Enter amount to swap"
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Transaction Info */}
            <div className="space-y-1 text-sm text-gray-600 pt-4">
              <div className="text-lg">
                <h3>Quote:</h3>
                <p>
                  {inputAmount} IT = {outputAmount / 10 ** 18} OT
                </p>
              </div>
              <div className="flex justify-between items-center">
                <span>Chain ID:</span>
                <span>HYPEREVM</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Order Type:</span>
                <span>{orderType}</span>
              </div>
            </div>

            {/* Swap Button */}
            <button
              onClick={handleSubmit}
              disabled={
                !inputToken ||
                !outputToken ||
                !inputAmount ||
                !userAddress ||
                !uniquePID
              }
              className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-lg transition-colors duration-200"
            >
              Get Price Quote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwapForm;
