"use client";
import { useChat } from "@ai-sdk/react";
import { Message } from "ai";
import { useEffect, useRef, useState } from "react";

// Define a type for our chat history
export type ChatHistory = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
};

// Define constants
export const CHAT_HISTORY_KEY = "f1gpt_chat_histories";
export const ACTIVE_CHAT_KEY = "f1gpt_active_chat";
export const OPENROUTER_KEY_STORAGE = "f1gpt_openrouter_key";
export const OPENROUTER_MODEL_STORAGE = "f1gpt_openrouter_model";

export const useChatStore = () => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return {
    isClient,
    chatHistories,
    activeChatId,
    showHistoryDropdown,
    setShowHistoryDropdown,
    showSettings,
    setShowSettings,
    status,
    messages,
    input,
    handleInputChange,
    handleSubmit,
    messagesEndRef,
    chatContainerRef,
    noMessages,
    createNewChat,
    switchChat,
    deleteChat,
    handlePrompt,
    resetCurrentChat,
    getActiveChat,
  };
};
