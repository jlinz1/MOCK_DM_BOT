"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function MessageBubble({ message, index }: { message: Message; index: number }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div
        className={`max-w-[75%] rounded-xl shadow-sm ${
          isUser
            ? "bg-[#2563EB] text-white"
            : "bg-white text-black border border-gray-200"
        }`}
      >
        <div className="p-4 whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Send 1, 2 or 3 to generate a scenario." }
  ]);
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  async function sendMessage() {
    if (!input.trim() || isLoading) return;

    const userInput = input.trim();
    const newMessages = [...messages, { role: "user" as const, content: userInput }];

    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, threadId: threadId }),
      });

      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch {
          errorData = { error: `HTTP ${res.status}: ${res.statusText}` };
        }
        throw new Error(errorData.error || "Failed to send message");
      }

      const data = await res.json();
      
      if (data.message && data.message.role && data.message.content) {
        setMessages((prev) => [...prev, data.message]);
        // Store thread ID for future messages
        if (data.threadId) {
          setThreadId(data.threadId);
        }
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      let errorMessage = "Sorry, I encountered an error. Please try again.";
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.name === "TypeError") {
        if (error?.message?.includes("fetch") || error?.message?.includes("Failed to fetch")) {
          errorMessage = "Connection error. Unable to reach the server. Please make sure the dev server is running (npm run dev).";
        } else {
          errorMessage = `TypeError: ${error.message || "Unknown error"}`;
        }
      }
      
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${errorMessage}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#F3F4F6]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-[60px] bg-[#111827] text-white flex items-center justify-center shadow-md z-10">
        <h1 className="text-xl font-bold">Athletic Freedom Mock DM Bot 2.0</h1>
      </header>

      {/* Main Chat Container */}
      <div className="flex-1 flex flex-col pt-[60px] pb-4 px-4">
        <div className="max-w-[800px] w-full mx-auto flex flex-col h-full">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {messages
              .filter((msg) => msg && msg.role && msg.content)
              .map((msg, i) => (
                <MessageBubble key={i} message={msg} index={i} />
              ))}
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
                  <div className="flex items-center space-x-2 text-gray-500">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                    <span className="ml-2">Bot is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="bg-white rounded-xl shadow-md p-4 mt-4">
            <div className="flex gap-3 items-end">
              <textarea
                ref={textareaRef}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all resize-none overflow-hidden min-h-[48px] max-h-[200px]"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                disabled={isLoading}
                rows={1}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="bg-[#2563EB] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm h-fit"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

