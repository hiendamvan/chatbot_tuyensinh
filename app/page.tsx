"use client";
import ChatHeader from "./components/ChatHeader";
import ChatMessages from "./components/ChatMessages";
import ChatInput from "./components/ChatInput";
import Settings from "./components/Settings";
import { useChatStore } from "./components/ChatStore";

const Home = () => {
  const {
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
  } = useChatStore();

  return (
    <main>
      <ChatHeader
        showHistoryDropdown={showHistoryDropdown}
        setShowHistoryDropdown={setShowHistoryDropdown}
        createNewChat={createNewChat}
        switchChat={switchChat}
        deleteChat={deleteChat}
        chatHistories={chatHistories}
        activeChatId={activeChatId}
        noMessages={noMessages}
        resetCurrentChat={resetCurrentChat}
        setShowSettings={setShowSettings}
      />

      <ChatMessages
        messages={messages}
        status={status}
        noMessages={noMessages}
        chatContainerRef={chatContainerRef}
        messagesEndRef={messagesEndRef}
        handlePrompt={handlePrompt}
      />

      <ChatInput
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
      />

      {/* Settings Modal */}
      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </main>
  );
};

export default Home;
