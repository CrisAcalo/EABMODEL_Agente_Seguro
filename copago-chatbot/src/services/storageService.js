import { seedData as defaultSeedData } from "../data/seedData";

const DATA_VERSION = "1.0.0";

const KEYS = {
  VERSION: "copago_app_version",
  SEED_DATA: "copago_seed_data",
  CHATS: "copago_chats",
  ACTIVE_CHAT_ID: "copago_active_chat_id"
};

export function initStorage() {
  const storedVersion = localStorage.getItem(KEYS.VERSION);

  if (storedVersion !== DATA_VERSION) {
    localStorage.setItem(KEYS.SEED_DATA, JSON.stringify(defaultSeedData));
    localStorage.setItem(KEYS.VERSION, DATA_VERSION);
  }

  if (!localStorage.getItem(KEYS.CHATS)) {
    localStorage.setItem(KEYS.CHATS, JSON.stringify([]));
  }

  if (!localStorage.getItem(KEYS.ACTIVE_CHAT_ID)) {
    const newChat = createNewChat();
    return newChat.id;
  }

  return localStorage.getItem(KEYS.ACTIVE_CHAT_ID);
}

export function getSeedData() {
  const raw = localStorage.getItem(KEYS.SEED_DATA);
  return raw ? JSON.parse(raw) : defaultSeedData;
}

export function getChats() {
  const raw = localStorage.getItem(KEYS.CHATS);
  return raw ? JSON.parse(raw) : [];
}

export function saveChats(chats) {
  localStorage.setItem(KEYS.CHATS, JSON.stringify(chats));
}

export function getActiveChatId() {
  return localStorage.getItem(KEYS.ACTIVE_CHAT_ID);
}

export function setActiveChatId(id) {
  localStorage.setItem(KEYS.ACTIVE_CHAT_ID, id);
}

export function createNewChat() {
  const id = `chat_${Date.now()}`;
  const now = new Date().toISOString();
  const newChat = {
    id,
    title: "Nueva conversación",
    createdAt: now,
    updatedAt: now,
    selectedPlanId: "plus",
    messages: [
      {
        role: "assistant",
        content:
          "Hola 👋 Soy tu asistente de copago y cobertura.\n\nCuéntame qué síntoma tienes o qué tipo de atención necesitas, y te ayudaré a estimar la especialidad, el copago y el hospital más conveniente según tu plan."
      }
    ],
    result: null
  };

  const chats = getChats();
  chats.unshift(newChat);
  saveChats(chats);
  setActiveChatId(id);
  return newChat;
}

export function updateChat(chatId, messages, result = undefined) {
  const chats = getChats();
  const idx = chats.findIndex((c) => c.id === chatId);
  if (idx === -1) return;

  chats[idx].messages = messages;
  chats[idx].updatedAt = new Date().toISOString();

  if (result !== undefined) {
    chats[idx].result = result;
  }

  const userMessages = messages.filter((m) => m.role === "user");
  if (userMessages.length > 0 && chats[idx].title === "Nueva conversación") {
    chats[idx].title = userMessages[0].content.slice(0, 35) || "Nueva conversación";
  }

  saveChats(chats);
}

export function deleteChat(chatId) {
  let chats = getChats();
  chats = chats.filter((c) => c.id !== chatId);
  saveChats(chats);
}

export function clearActiveChat() {
  localStorage.removeItem(KEYS.ACTIVE_CHAT_ID);
}
