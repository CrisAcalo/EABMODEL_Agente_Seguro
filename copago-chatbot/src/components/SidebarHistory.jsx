export default function SidebarHistory({ chats, activeChatId, onSelectChat, onNewChat, onDeleteChat }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Historial</h2>
        <button className="btn-new-chat" onClick={onNewChat}>
          + Nuevo chat
        </button>
      </div>
      <ul className="chat-list">
        {chats.length === 0 && (
          <li className="chat-list-empty">Sin conversaciones</li>
        )}
        {chats.map((chat) => (
          <li
            key={chat.id}
            className={`chat-item ${chat.id === activeChatId ? "active" : ""}`}
            onClick={() => onSelectChat(chat.id)}
          >
            <div className="chat-item-title">{chat.title}</div>
            <div className="chat-item-date">
              {new Date(chat.updatedAt).toLocaleDateString("es-EC", {
                day: "2-digit",
                month: "short"
              })}
            </div>
            <button
              className="btn-delete-chat"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteChat(chat.id);
              }}
              title="Eliminar chat"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
