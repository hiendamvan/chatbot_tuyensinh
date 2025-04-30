"use client";
import { Message } from "ai";
import Bubble from "./Bubble";
import LoadingBubble from "./LoadingBubble";
import PromptSuggestionRow from "./PromptSuggestionRow";

type ChatMessagesProps = {
  messages: Message[];
  status: "ready" | "error" | "streaming" | "submitted";
  noMessages: boolean;
  chatContainerRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  handlePrompt: (promptText: string) => void;
};

const ChatMessages = ({
  messages,
  status,
  noMessages,
  chatContainerRef,
  messagesEndRef,
  handlePrompt,
}: ChatMessagesProps) => {
  return (
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
  );
};

export default ChatMessages;
