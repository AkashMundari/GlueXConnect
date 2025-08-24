import React, { useState } from "react";

const Searching = () => {
  // State for user inputs and data display
  const [symbol, setSymbol] = useState("");
  const [blockchainKey, setBlockchainKey] = useState("");
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // IMPORTANT: Replace with your actual CryptoRank API key.
  const apiKey = "b6f7fdaaaa32b090872c09a8cb72ed3b059f06890a74d08c00be732a079c";

  // Function to handle form submission and fetch the contract address
  const handleFetchAddress = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setContracts([]);

    // Guardrail: Do not proceed without a valid API key
    if (!apiKey) {
      setError("Please provide a valid CryptoRank API key in the code.");
      setLoading(false);
      return;
    }

    // Guardrail: Ensure at least the symbol is provided
    if (!symbol) {
      setError("Please enter a cryptocurrency symbol (e.g., USDC).");
      setLoading(false);
      return;
    }

    try {
      // --- STEP 1: Get all currencies to find the ID of the target token ---
      const mapUrl = "https://api.cryptorank.io/v2/currencies/map";
      const mapResponse = await fetch(mapUrl, {
        method: "GET",
        headers: {
          "X-Api-Key": apiKey,
        },
      });

      if (!mapResponse.ok) {
        throw new Error(`API map call failed: ${mapResponse.statusText}`);
      }

      const mapData = await mapResponse.json();
      console.log(mapData);
      const cryptoInfo = mapData.data.find(
        (currency) => currency.symbol?.toUpperCase() === symbol.toUpperCase()
      );

      if (!cryptoInfo) {
        throw new Error(`No cryptocurrency found with symbol "${symbol}".`);
      }

      const cryptoId = cryptoInfo.id;

      // --- STEP 2: Fetch detailed currency data using the found ID ---
      const currencyUrl = `https://api.cryptorank.io/v2/currencies/${cryptoId}`;
      const currencyResponse = await fetch(currencyUrl, {
        method: "GET",
        headers: {
          "X-Api-Key": apiKey,
        },
      });

      if (!currencyResponse.ok) {
        throw new Error(
          `API currency data call failed: ${currencyResponse.statusText}`
        );
      }

      const currencyData = await currencyResponse.json();
      console.log(currencyData);

      if (currencyData.data && currencyData.data.contracts) {
        // Filter contracts by blockchain key if provided
        if (blockchainKey) {
          const filteredContracts = currencyData.data.contracts.filter(
            (contract) =>
              contract.platform &&
              contract.platform.key.toLowerCase() ===
                blockchainKey.toLowerCase()
          );
          setContracts(filteredContracts);
        } else {
          // If no blockchain is specified, show all contracts
          setContracts(currencyData.data.contracts);
        }
      } else {
        setContracts([]);
      }
    } catch (err) {
      console.error("Error fetching crypto data:", err);
      setError(
        err.message || "An unexpected error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-extrabold text-indigo-400">
            Token Contract Address Finder
          </h1>
          <p className="mt-2 text-gray-400 text-lg">
            Find a token's contract address by its symbol and blockchain.
          </p>
        </header>

        {/* Input Form */}
        <form
          onSubmit={handleFetchAddress}
          className="bg-gray-800 p-8 rounded-2xl shadow-xl flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4"
        >
          <div className="flex-grow w-full md:w-auto">
            <label htmlFor="symbol" className="sr-only">
              Cryptocurrency Symbol
            </label>
            <input
              id="symbol"
              type="text"
              placeholder="e.g., USDC"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700  border-none rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-gray-400"
            />
          </div>
          <div className="flex-grow w-full md:w-auto">
            <label htmlFor="blockchain" className="sr-only">
              Blockchain Key
            </label>
            <input
              id="blockchain"
              type="text"
              placeholder="e.g., ethereum (optional)"
              value={blockchainKey}
              onChange={(e) => setBlockchainKey(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700  border-none rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-gray-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto px-6 py-3 bg-indigo-600  font-bold rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors duration-200 disabled:bg-gray-600"
          >
            {loading ? "Fetching..." : "Find Address"}
          </button>
        </form>

        {/* Loading and Error States */}
        {loading && (
          <div className="flex justify-center items-center h-48">
            <div className="w-12 h-12 border-4 border-b-transparent border-indigo-500 rounded-full animate-spin"></div>
          </div>
        )}
        {error && (
          <div className="bg-red-900 text-red-300 p-4 rounded-lg text-center">
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* Display Contracts */}
        {!loading && !error && contracts.length > 0 && (
          <div className="bg-gray-800 p-8 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-2xl font-semibold ">
              Contract Address{contracts.length > 1 ? "es" : ""} for{" "}
              {symbol.toUpperCase()}
            </h3>
            <ul className="space-y-3">
              {contracts.map((contract, index) => (
                <li
                  key={index}
                  className=" p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 sm:space-x-4"
                >
                  <div className="flex-1">
                    <p className="text-sm ">Blockchain:</p>
                    <p className="font-medium text-lg ">
                      {contract.platform?.name || "N/A"}
                    </p>
                  </div>
                  <div className="flex-2 break-all">
                    <p className="text-sm text-gray-400">Address:</p>
                    <span className="text-blue-300">{contract.address}</span>
                    <p className="text-sm text-gray-400">Decimals:</p>
                    <span className="text-blue-300">{contract.decimals}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!loading && !error && contracts.length === 0 && symbol && (
          <div className="bg-gray-800 p-6 rounded-lg text-center text-gray-400">
            No contract addresses found for {symbol.toUpperCase()} on the
            specified blockchain.
          </div>
        )}
      </div>
    </div>
  );
};

export default Searching;
