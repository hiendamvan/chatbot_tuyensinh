"use client";
import React from "react";

type ChatInputProps = {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

const ChatInput = ({
  input,
  handleInputChange,
  handleSubmit,
}: ChatInputProps) => {
  return (
    <form onSubmit={handleSubmit}>
      <input
        className="question-box"
        onChange={handleInputChange}
        value={input}
        placeholder="Ask me something..."
      />
      <input type="submit" value="Send" />
    </form>
  );
};

export default ChatInput;
