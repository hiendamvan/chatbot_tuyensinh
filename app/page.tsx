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
  const chatContainerRef = useRef<HTMLDivElement>(null);
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

  // Improved scroll function
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
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
            className="clear-button"
            title="Clear chat history"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
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
        ref={chatContainerRef}
        className={`chat-section ${noMessages ? "" : "populated"}`}
      >
        {noMessages ? (
          <div className="p-4">
            <p className="starter-text">Ask me anything about volleyball ^^!</p>
            <br />
            <PromptSuggestionRow onPromptClick={handlePrompt} />
          </div>
        ) : (
          <div className="messages-container">
            <div>
              {messages.map((message, index) => (
                <div key={`message-${index}`} className="message-wrapper">
                  <Bubble message={message} />
                </div>
              ))}
              {status && <LoadingBubble />}
            </div>
            <div ref={messagesEndRef} />
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
