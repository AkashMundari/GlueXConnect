# GlueX Connect 🤖⚡

An AI-powered cryptocurrency swap assistant that enables seamless token swapping across multiple blockchains using natural language commands. Built with React, LangChain, and the **GlueX Router API**.

<img width="900" height="800" alt="04" src="https://github.com/user-attachments/assets/f50e371d-5441-4756-9322-c3d4987a0bff" center />


## 🚀 Features

<img width="900" height="800" alt="05" src="https://github.com/user-attachments/assets/9fcb806d-b0ec-4f29-9588-c62f1885a51e" />


- **Natural Language Processing**: Chat with an AI assistant to perform token swaps using simple commands
- **Multi-Chain Support**: Swap tokens across multiple blockchains including Ethereum, HyperEVM, Arbitrum, Base, Polygon, and more
- **Automatic Token Resolution**: Input token symbols and let the AI fetch contract addresses automatically
- **Real-Time Price Quotes**: Get accurate swap quotes before executing transactions
- **Wallet Integration**: Connect your MetaMask wallet for seamless transactions
- **Smart Contract Discovery**: Automatically finds token contract addresses using CryptoRank API & other search apis

## 🛠️ Tech Stack

- **Frontend**: React 19.1.1 with Vite
- **Styling**: Tailwind CSS
- **AI/LLM**: LangChain with Groq (Llama3-8B model)
- **APIs**: 
  - GlueX Router API for cross-chain swaps
  - CryptoRank API for token contract addresses
- **Wallet**: MetaMask integration
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 16+ 
- MetaMask browser extension
- Groq API key
- CryptoRank API key
- GlueX PID

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AkashMundari/gluexconnect.git
   cd gluexconnect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_GROQ_API_KEY=your_groq_api_key_here
   VITE_CRYPTORANK_API_KEY=your_cryptorank_api_key_here
   VITE_GLUEX_PID=your_gluex_pid_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🎯 Usage

### Basic Swap Commands

The AI assistant understands natural language commands for token swaps:

- `swap 1 USDC for ETH on ethereum`
- `I want to swap 100 kHYPE for USOL on hyperevm`

### Supported Chains

- Ethereum
- HyperEVM  
- Arbitrum
- Base
- Polygon
- Optimism
- Avalanche
- BNB Chain
- Gnosis
- Berachain
- Unichain

## 🔑 API Configuration

### Groq API Setup
1. Sign up at [Groq Console](https://console.groq.com/)
2. Generate an API key
3. Add to your `.env.local` file

### CryptoRank API Setup
1. Register at [CryptoRank](https://cryptorank.io/api)
2. Get your API key
3. Add to your `.env.local` file

### GlueX PID
1. Creat an account on the GlueX portal
2. Add your PID to the environment

## 📁 Project Structure

```
src/
├── components/
│   ├── FinalChatInterface.jsx    # Main AI chat interface
├── App.jsx                       # Main app component
├── main.jsx                      # App entry point
└── index.css                     # Global styles
```

## 🤖 AI Integration

The project uses LangChain with Groq's Llama3-8B model to:

1. **Parse User Intent**: Detect swap requests from natural language
2. **Extract Parameters**: Identify input/output tokens, amounts, and chains
3. **Generate Responses**: Provide helpful feedback and explanations
4. **Handle Errors**: Gracefully manage API failures and user errors

### Example AI Flow

```javascript
// User input: "swap 1 USDC for ETH on ethereum"
// AI extracts:
{
  "inputTokenSymbol": "USDC",
  "outputTokenSymbol": "ETH", 
  "inputAmount": "1",
  "chainID": "ethereum"
}
```

## 🔒 Security Features

- **Wallet Connection Validation**: Ensures proper MetaMask connection
- **Input Sanitization**: Validates all user inputs and API responses
- **Error Handling**: Comprehensive error management for API failures
- **No Private Key Storage**: Uses MetaMask for secure transaction signing

## 🚧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🙏 Acknowledgments

- [GlueX](https://gluex.xyz/) for the cross-chain router API
- [Groq](https://groq.com/) for the fast AI inference
- [CryptoRank](https://cryptorank.io/) for token data
- [LangChain](https://langchain.com/) for AI framework

