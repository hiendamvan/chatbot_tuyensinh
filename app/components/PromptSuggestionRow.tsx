import PromptSuggestionButton from "./PromptSuggestionButton";

const PromptSuggestionRow = ({ onPromptClick }) => {
  const prompts = [
    "Trường Đại học Công nghệ có các địa chỉ học tập nào?",
    "Trường Đại học Công nghệ, Đại học Quốc gia Hà Nội có trụ sở chính ở đâu?",
    "Giới thiệu ngành Khoa học máy tinh tại trường Đại học Công nghệ?",
  ];
  return (
    <div className="prompt-suggestion-row">
      {prompts.map((prompt, index) => (
        <PromptSuggestionButton
          key={`suggestion-${index}`}
          text={prompt}
          onClick={() => onPromptClick(prompt)}
        />
      ))}
    </div>
  );
};

export default PromptSuggestionRow;
