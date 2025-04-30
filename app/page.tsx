"use client";
import Image from "next/image";
import f1GPTLogo from "./assets/logo.png";
import { useChat } from "@ai-sdk/react";
import { Message } from "ai";
import Bubble from "./components/Bubble";
import LoadingBubble from "./components/LoadingBubble";
import PromptSuggestionRow from "./components/PromptSuggestionRow";
import { useEffect, useRef, useState } from "react";
import Settings from "./components/Settings";

// Define a type for our chat history
type ChatHistory = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
};

// Define constants
const CHAT_HISTORY_KEY = "f1gpt_chat_histories";
const ACTIVE_CHAT_KEY = "f1gpt_active_chat";
const OPENROUTER_KEY_STORAGE = "f1gpt_openrouter_key";
const OPENROUTER_MODEL_STORAGE = "f1gpt_openrouter_model";

const Home = () => {
  const [isClient, setIsClient] = useState(false);
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Get the API key and model for OpenRouter
  const [openRouterKey, setOpenRouterKey] = useState<string | null>(null);
  const [openRouterModel, setOpenRouterModel] = useState<string | null>(null);

  const {
    append,
    status,
    messages,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    setMessages,
  } = useChat({
    body: {
      openRouterKey: openRouterKey || undefined,
      openRouterModel: openRouterModel || undefined,
    },
  });

  // Custom submit handler that includes the API key and model
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const apiKey = localStorage.getItem(OPENROUTER_KEY_STORAGE) || undefined;
    const model = localStorage.getItem(OPENROUTER_MODEL_STORAGE) || undefined;

    originalHandleSubmit(e, {
      body: {
        openRouterKey: apiKey,
        openRouterModel: model,
      },
    });
  };

  // Load the API key and model from localStorage
  useEffect(() => {
    if (isClient) {
      const apiKey = localStorage.getItem(OPENROUTER_KEY_STORAGE) || null;
      const model = localStorage.getItem(OPENROUTER_MODEL_STORAGE) || null;

      setOpenRouterKey(apiKey);
      setOpenRouterModel(model);
    }
  }, [isClient, showSettings]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const noMessages = !messages || messages.length === 0;

  // Handle client-side initialization
  useEffect(() => {
    setIsClient(true);

    // Load chat histories
    const savedHistories = localStorage.getItem(CHAT_HISTORY_KEY);
    const savedActiveChatId = localStorage.getItem(ACTIVE_CHAT_KEY);

    let histories: ChatHistory[] = [];
    let activeChat: string | null = null;

    if (savedHistories) {
      try {
        histories = JSON.parse(savedHistories);
        setChatHistories(histories);
      } catch (e) {
        console.error("Failed to parse saved history:", e);
        localStorage.removeItem(CHAT_HISTORY_KEY);
      }
    }

    if (savedActiveChatId) {
      activeChat = savedActiveChatId;
      setActiveChatId(activeChat);

      // Load active chat messages
      const chat = histories.find((h) => h.id === activeChat);
      if (chat) {
        setMessages(chat.messages);
      }
    }

    // If no active chat, create a new one
    if (!activeChat && histories.length === 0) {
      createNewChat();
    } else if (!activeChat && histories.length > 0) {
      // Set the most recent chat as active
      const mostRecent = histories.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      setActiveChatId(mostRecent.id);
      setMessages(mostRecent.messages);
      localStorage.setItem(ACTIVE_CHAT_KEY, mostRecent.id);
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
    if (isClient && messages.length > 0 && activeChatId) {
      // Update the current chat history
      const updatedHistories = chatHistories.map((chat) => {
        if (chat.id === activeChatId) {
          // Update title if this is the first message
          let title = chat.title;
          if (chat.messages.length === 0 && messages.length > 0) {
            // Use first few words of first message as title
            title =
              messages[0].content.split(" ").slice(0, 5).join(" ") + "...";
          }
          return {
            ...chat,
            messages: messages,
            title: title,
          };
        }
        return chat;
      });

      setChatHistories(updatedHistories);
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(updatedHistories));
    }
  }, [messages, isClient, activeChatId]);

  const createNewChat = () => {
    const newChatId = crypto.randomUUID();
    const newChat: ChatHistory = {
      id: newChatId,
      title: "New Chat",
      messages: [],
      createdAt: new Date().toISOString(),
    };

    const updatedHistories = [...chatHistories, newChat];
    setChatHistories(updatedHistories);
    setActiveChatId(newChatId);
    setMessages([]);

    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(updatedHistories));
    localStorage.setItem(ACTIVE_CHAT_KEY, newChatId);
    setShowHistoryDropdown(false);
  };

  const switchChat = (chatId: string) => {
    const chat = chatHistories.find((h) => h.id === chatId);
    if (chat) {
      setActiveChatId(chatId);
      setMessages(chat.messages);
      localStorage.setItem(ACTIVE_CHAT_KEY, chatId);
      setShowHistoryDropdown(false);
    }
  };

  const deleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering switchChat

    const updatedHistories = chatHistories.filter((chat) => chat.id !== chatId);
    setChatHistories(updatedHistories);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(updatedHistories));

    // If we're deleting the active chat, switch to the most recent one
    if (chatId === activeChatId) {
      if (updatedHistories.length === 0) {
        createNewChat();
      } else {
        const mostRecent = updatedHistories.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        setActiveChatId(mostRecent.id);
        setMessages(mostRecent.messages);
        localStorage.setItem(ACTIVE_CHAT_KEY, mostRecent.id);
      }
    }
  };

  const handlePrompt = (promptText: string) => {
    const msg: Message = {
      id: crypto.randomUUID(),
      content: promptText,
      role: "user",
    };
    append(msg);
  };

  const resetCurrentChat = () => {
    if (activeChatId) {
      const updatedHistories = chatHistories.map((chat) => {
        if (chat.id === activeChatId) {
          return {
            ...chat,
            messages: [],
            title: "New Chat",
          };
        }
        return chat;
      });

      setChatHistories(updatedHistories);
      setMessages([]);
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(updatedHistories));
    }
  };

  const getActiveChat = () => {
    return chatHistories.find((chat) => chat.id === activeChatId);
  };

  return (
    <main>
      <header className="header">
        {/* Chat history button */}
        <button
          className="history-button"
          onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
          title="Chat history"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            width="16"
            height="16"
          >
            <path d="M5.566 4.657A4.505 4.505 0 016.75 4.5h10.5c.41 0 .806.055 1.183.157A3 3 0 0015.75 3h-7.5a3 3 0 00-2.684 1.657zM2.25 12a3 3 0 013-3h13.5a3 3 0 013 3v6a3 3 0 01-3 3H5.25a3 3 0 01-3-3v-6zM5.25 7.5c-.41 0-.806.055-1.184.157A3 3 0 016.75 6h10.5a3 3 0 012.683 1.657A4.505 4.505 0 0018.75 7.5H5.25z" />
          </svg>
          <span>Chats</span>
        </button>

        {/* Chat history dropdown */}
        {showHistoryDropdown && (
          <div className="history-dropdown">
            <div className="history-dropdown-header">
              <span>Chat History</span>
            </div>
            <button className="new-chat-button" onClick={createNewChat}>
              New Chat
            </button>
            <div className="history-list">
              {chatHistories.length === 0 ? (
                <div className="history-item">No chat history</div>
              ) : (
                chatHistories
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  )
                  .map((chat) => (
                    <div
                      key={chat.id}
                      className={`history-item ${
                        chat.id === activeChatId ? "active" : ""
                      }`}
                      onClick={() => switchChat(chat.id)}
                    >
                      <div className="history-item-content">{chat.title}</div>
                      <div className="history-item-actions">
                        <button
                          className="history-action-button"
                          onClick={(e) => deleteChat(chat.id, e)}
                          title="Delete chat"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            width="16"
                            height="16"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        <Image
          src={f1GPTLogo}
          width="200"
          height="70"
          alt="F1GPT Logo"
          className="logo"
        />

        {/* Settings button */}
        <button
          className="settings-button"
          onClick={() => setShowSettings(true)}
          title="Settings"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            width="16"
            height="16"
          >
            <path
              fillRule="evenodd"
              d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {!noMessages && (
          <button
            onClick={resetCurrentChat}
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
      </header>
      <section
        ref={chatContainerRef}
        className={`chat-section ${noMessages ? "" : "populated"}`}
      >
        {noMessages ? (
          <div className="p-4" style={{ position: "relative", height: "100%" }}>
            <p className="starter-text">Ask me anything about volleyball ^^!</p>
            <PromptSuggestionRow onPromptClick={handlePrompt} />
          </div>
        ) : (
          <div className="messages-container">
            <div>
              {messages.map((message, index) => (
                <div key={`message-${index}`} className="message-wrapper">
                  <Bubble content={message.content} role={message.role} />
                </div>
              ))}
              {(status === "streaming" || status === "submitted") &&
                messages.length > 0 && <LoadingBubble />}
            </div>
            <div ref={messagesEndRef} />
          </div>
        )}
      </section>
      <form onSubmit={handleSubmit}>
        <input
          className="question-box"
          onChange={handleInputChange}
          value={input}
          placeholder="Ask me something..."
        />
        <input type="submit" value="Send" />
      </form>

      {/* Settings Modal */}
      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </main>
  );
};

export default Home;
