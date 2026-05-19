import { useRef } from "react";

export default function ChatInput({ value, onChange, onSend, loading }) {
  const textareaRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="chat-input-area">
      <textarea
        ref={textareaRef}
        className="chat-textarea"
        placeholder="Describe tu síntoma o necesidad médica..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
        disabled={loading}
      />
      <button
        className="btn-send"
        onClick={onSend}
        disabled={loading || !value.trim()}
      >
        {loading ? "..." : "Enviar"}
      </button>
    </div>
  );
}
