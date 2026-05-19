import { renderMarkdown } from "../utils/renderMarkdown";

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="chat-message user">
        <div className="message-bubble">{message.content}</div>
      </div>
    );
  }

  // Assistant: render markdown safely
  return (
    <div className="chat-message assistant">
      <div
        className="message-bubble"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
      />
    </div>
  );
}
