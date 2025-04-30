"use client";
import Image from "next/image";
import f1GPTLogo from "./assets/logo.png";
import { useChat } from "@ai-sdk/react";
import { Message } from "ai";
import Bubble from "./components/Bubble";
import LoadingBubble from "./components/LoadingBubble";
import PromptSuggestionRow from "./components/PromptSuggestionRow";
import { useEffect, useRef, useState } from "react";

const CHAT_HISTORY_KEY = "chat_history";

const Home = () => {
  const [isClient, setIsClient] = useState(false);
  const {
    append,
    status,
    messages,
    input,
    handleInputChange,
    handleSubmit,
    setMessages,
  } = useChat({
    initialMessages: [],
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const noMessages = !messages || messages.length === 0;

  // Handle client-side initialization
  useEffect(() => {
    setIsClient(true);
    const savedMessages = localStorage.getItem(CHAT_HISTORY_KEY);
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
      } catch (e) {
        console.error("Failed to parse saved messages:", e);
        localStorage.removeItem(CHAT_HISTORY_KEY);
      }
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll when messages or loading state changes
  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, status]);

  // Save messages whenever they change
  useEffect(() => {
    if (isClient && messages.length > 0) {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
    }
  }, [messages, isClient]);

  const handlePrompt = (promptText: string) => {
    const msg: Message = {
      id: crypto.randomUUID(),
      content: promptText,
      role: "user",
    };
    append(msg);
  };

  const resetChat = () => {
    setMessages([]);
    localStorage.removeItem(CHAT_HISTORY_KEY);
  };

  return (
    <main className="flex flex-col h-screen">
      <div className="relative">
        <div className="p-4 flex justify-center">
          <Image
            src={f1GPTLogo}
            width="250"
            alt="F1GPT Logo"
            className="logo"
          />
        </div>
        {!noMessages && (
          <button
            onClick={resetChat}
            style={{
              background: "linear-gradient(to right, #6366f1, #a855f7)",
              boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              position: "absolute",
              top: "1rem",
              right: "1rem",
              padding: "0.5rem",
              color: "white",
              borderRadius: "9999px",
              transition: "all 0.2s",
              transform: "scale(1)",
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "scale(1)";
            }}
            title="Clear chat history"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              style={{
                height: "1rem",
                width: "1rem",
              }}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
      <section
        style={{
          flex: 1,
          overflowY: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: "#4F46E5 transparent",
          position: "relative",
          border: "1px solid #E2E8F0",
          borderRadius: "8px",
          margin: "0 16px",
          maxHeight: "calc(100vh - 200px)",
          minHeight: "300px",
          height: "100%",
          paddingRight: "4px",
        }}
        className={noMessages ? "" : "populated"}
        onScroll={(e) => {
          console.log("Scrolling", e.currentTarget.scrollTop);
        }}
      >
        <style jsx global>{`
          /* For Webkit browsers like Chrome and Safari */
          ::-webkit-scrollbar {
            width: 12px;
            height: 12px;
          }

          ::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
          }

          ::-webkit-scrollbar-thumb {
            background-color: #6366f1;
            border-radius: 10px;
            border: 3px solid #f1f5f9;
          }

          ::-webkit-scrollbar-thumb:hover {
            background-color: #4f46e5;
          }

          /* For Firefox */
          * {
            scrollbar-width: thin;
            scrollbar-color: #6366f1 #f1f5f9;
          }
        `}</style>
        {noMessages ? (
          <div className="p-4">
            <p className="starter-text">Ask me anything about volleyball ^^!</p>
            <br />
            <PromptSuggestionRow onPromptClick={handlePrompt} />
          </div>
        ) : (
          <div
            className="p-4"
            style={{
              minHeight: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ flexGrow: 1 }}>
              {messages.map((message, index) => (
                <div
                  key={`message-${index}`}
                  style={{
                    marginBottom: "16px",
                    wordBreak: "break-word",
                  }}
                >
                  <Bubble message={message} />
                </div>
              ))}
              {status && <LoadingBubble />}
            </div>
            <div ref={messagesEndRef} style={{ height: "1px" }} />
          </div>
        )}
      </section>
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <input
          className="question-box w-full"
          onChange={handleInputChange}
          value={input}
          placeholder="Ask me something ..."
        />
        <input type="submit" />
      </form>
    </main>
  );
};

export default Home;
