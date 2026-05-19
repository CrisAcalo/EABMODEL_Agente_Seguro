export default function SidebarHistory({
  chats,
  activeChatId,
  activeView,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onViewChange,
}) {
  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">🏥</span>
        <span className="sidebar-brand-name">Copago AI</span>
      </div>

      {/* Primary navigation */}
      <nav className="sidebar-nav">
        <button
          className={`sidebar-nav-item ${activeView === "chat" ? "active" : ""}`}
          onClick={() => onViewChange("chat")}
        >
          <span className="nav-icon">💬</span>
          <span>Chat</span>
        </button>
        <button
          className={`sidebar-nav-item ${activeView === "info" ? "active" : ""}`}
          onClick={() => onViewChange("info")}
        >
          <span className="nav-icon">📋</span>
          <span>Información</span>
        </button>
      </nav>

      {/* Chat history — only visible in chat view */}
      {activeView === "chat" && (
        <>
          <div className="sidebar-header">
            <h2>Historial</h2>
            <button className="btn-new-chat" onClick={onNewChat}>
              + Nuevo
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
                    month: "short",
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
        </>
      )}
    </aside>
  );
}
