"use client";
import Image from "next/image";
import ChatHistory from "./ChatHistory";
import f1GPTLogo from "../assets/logo.png";
import ChatIcon from "./icons/ChatIcon";
import SettingsIcon from "./icons/SettingsIcon";
import ClearIcon from "./icons/ClearIcon";

type ChatHeaderProps = {
  showHistoryDropdown: boolean;
  setShowHistoryDropdown: (show: boolean) => void;
  createNewChat: () => void;
  switchChat: (chatId: string) => void;
  deleteChat: (chatId: string, e: React.MouseEvent) => void;
  chatHistories: any[];
  activeChatId: string | null;
  noMessages: boolean;
  resetCurrentChat: () => void;
  setShowSettings: (show: boolean) => void;
};

const ChatHeader = ({
  showHistoryDropdown,
  setShowHistoryDropdown,
  createNewChat,
  switchChat,
  deleteChat,
  chatHistories,
  activeChatId,
  noMessages,
  resetCurrentChat,
  setShowSettings,
}: ChatHeaderProps) => {
  return (
    <header className="header">
      {/* Chat history button */}
      <button
        className="history-button"
        onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
        title="Chat history"
      >
        <ChatIcon />
        <span>Chats</span>
      </button>

      {/* Chat history dropdown */}
      {showHistoryDropdown && (
        <ChatHistory
          chatHistories={chatHistories}
          activeChatId={activeChatId}
          createNewChat={createNewChat}
          switchChat={switchChat}
          deleteChat={deleteChat}
        />
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
        <SettingsIcon />
      </button>

      {!noMessages && (
        <button
          onClick={resetCurrentChat}
          className="clear-button"
          title="Clear chat history"
        >
          <ClearIcon />
        </button>
      )}
    </header>
  );
};

export default ChatHeader;
