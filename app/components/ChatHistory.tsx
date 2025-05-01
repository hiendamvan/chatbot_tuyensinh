"use client";

import DeleteIcon from "./icons/DeleteIcon";

type ChatHistoryProps = {
  chatHistories: Array<{
    id: string;
    title: string;
    messages: any[];
    createdAt: string;
  }>;
  activeChatId: string | null;
  createNewChat: () => void;
  switchChat: (chatId: string) => void;
  deleteChat: (chatId: string, e: React.MouseEvent) => void;
};

const ChatHistory = ({
  chatHistories,
  activeChatId,
  createNewChat,
  switchChat,
  deleteChat,
}: ChatHistoryProps) => {
  return (
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
                    <DeleteIcon />
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default ChatHistory;
