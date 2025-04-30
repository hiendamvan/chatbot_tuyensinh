"use client";
import Image from "next/image";
import ChatHistory from "./ChatHistory";
import f1GPTLogo from "../assets/logo.png";

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
  );
};

export default ChatHeader;
