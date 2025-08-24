import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import { ChatGroq } from "@langchain/groq";
import { HumanMessage } from "@langchain/core/messages";

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    { role: "ai", content: "Hello! I'm your AI assistant. How can I help?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Groq LangChain client
  const llm = new ChatGroq({
    apiKey: "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", // put in .env.local
    model: "llama3-8b-8192",
  });

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await llm.invoke([new HumanMessage(input)]);
      const aiMessage = { role: "ai", content: response.content };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error fetching response:", error);
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "⚠️ Error connecting to Groq API." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 ">
      {/* Header */}
      <div className="p-4 bg-gray-900 border-b border-gray-800 text-lg font-semibold flex items-center shadow-md">
        <Bot className="mr-2 text-green-400" /> LangChain + Groq Chat
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-3xl mx-auto w-full">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-md transition-all ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-gray-800 text-gray-100 rounded-bl-none"
              }`}
            >
              <div className="flex items-start space-x-2">
                {msg.role === "ai" && (
                  <Bot className="w-5 h-5 mt-1 text-green-400 shrink-0" />
                )}
                <span className="whitespace-pre-wrap">{msg.content}</span>
                {msg.role === "user" && (
                  <User className="w-5 h-5 mt-1 text-blue-200 shrink-0" />
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 text-gray-400 text-sm">
            <Bot className="w-4 h-4 animate-pulse" />
            <span className="animate-pulse">AI is typing...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input box */}
      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <div className="flex items-center max-w-3xl mx-auto w-full">
          <input
            type="text"
            className="flex-1 px-4 py-3 rounded-xl bg-gray-800  outline-none border border-gray-700 focus:ring-2 focus:ring-blue-500 transition"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="ml-3 p-3 bg-blue-600 rounded-xl hover:bg-blue-500 transition disabled:opacity-50 shadow-md"
            disabled={isLoading}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
