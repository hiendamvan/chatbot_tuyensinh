import { useState, useEffect } from "react";

const OPENROUTER_KEY_STORAGE = "f1gpt_openrouter_key";
const OPENROUTER_MODEL_STORAGE = "f1gpt_openrouter_model";

// Available OpenRouter models with friendly names
const AVAILABLE_MODELS = [
  { id: "gpt-4o-mini", name: "GPT-4o Mini" },
  { id: "gpt-4o", name: "GPT-4o" },
  { id: "claude-3-opus-20240229", name: "Claude 3 Opus" },
  { id: "claude-3-sonnet-20240229", name: "Claude 3 Sonnet" },
  { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku" },
  { id: "meta-llama/llama-3-70b-instruct", name: "Llama 3 70B" },
  { id: "meta-llama/llama-3-8b-instruct", name: "Llama 3 8B" },
  { id: "mistralai/mistral-medium", name: "Mistral Medium" },
  { id: "mistralai/mistral-small", name: "Mistral Small" },
  { id: "mistralai/mistral-tiny", name: "Mistral Tiny" },
];

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const Settings = ({ isOpen, onClose }: SettingsProps) => {
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const savedKey = localStorage.getItem(OPENROUTER_KEY_STORAGE) || "";
      const savedModel =
        localStorage.getItem(OPENROUTER_MODEL_STORAGE) ||
        AVAILABLE_MODELS[0].id;

      setApiKey(savedKey);
      setSelectedModel(savedModel);
      setIsSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem(OPENROUTER_KEY_STORAGE, apiKey);
    localStorage.setItem(OPENROUTER_MODEL_STORAGE, selectedModel);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Settings</h2>
          <button onClick={onClose} className="close-button">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              width="20"
              height="20"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div className="settings-content">
          <div className="settings-group">
            <label htmlFor="api-key">OpenRouter API Key</label>
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your OpenRouter API key"
              className="settings-input"
            />
            <p className="settings-help">
              You can get an OpenRouter API key from{" "}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
              >
                openrouter.ai/keys
              </a>
            </p>
          </div>

          <div className="settings-group">
            <label htmlFor="model-select">AI Model</label>
            <select
              id="model-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="settings-select"
            >
              {AVAILABLE_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            <p className="settings-help">
              Select the AI model you would like to use. More powerful models
              may cost more credits but provide better responses.
            </p>
          </div>

          {isSaved && <p className="settings-saved">Settings saved!</p>}
        </div>
        <div className="settings-footer">
          <button onClick={handleSave} className="settings-save-button">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
