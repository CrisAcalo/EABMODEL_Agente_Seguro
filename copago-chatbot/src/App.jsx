import { useState, useEffect, useRef } from "react";
import {
  initStorage,
  getSeedData,
  getChats,
  saveChats,
  createNewChat,
  updateChat,
  deleteChat,
  setActiveChatId,
  getActiveChatId
} from "./services/storageService";
import { analyzeSymptom, FALLBACK } from "./services/geminiService";
import { estimateCoverage } from "./services/estimatorService";

import SidebarHistory from "./components/SidebarHistory";
import PlanSelector from "./components/PlanSelector";
import ChatMessage from "./components/ChatMessage";
import ChatInput from "./components/ChatInput";
import ResultCard from "./components/ResultCard";
import "./styles.css";

export default function App() {
  const [seedData, setSeedData] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatIdState] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState("plus");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const activeId = initStorage();
    const data = getSeedData();
    const allChats = getChats();
    setSeedData(data);
    setChats(allChats);
    setActiveChatIdState(activeId);
    const found = allChats.find((c) => c.id === activeId);
    if (found) {
      setActiveChat(found);
      setSelectedPlanId(found.selectedPlanId || "plus");
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages, loading]);

  const refreshChats = (newActiveChatId) => {
    const allChats = getChats();
    setChats(allChats);
    const id = newActiveChatId || getActiveChatId();
    const found = allChats.find((c) => c.id === id);
    setActiveChatIdState(id);
    setActiveChat(found || null);
    if (found) setSelectedPlanId(found.selectedPlanId || "plus");
  };

  const handleNewChat = () => {
    const newChat = createNewChat();
    refreshChats(newChat.id);
    setInput("");
    setError("");
  };

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    setActiveChatIdState(chatId);
    const found = getChats().find((c) => c.id === chatId);
    setActiveChat(found || null);
    if (found) setSelectedPlanId(found.selectedPlanId || "plus");
    setError("");
  };

  const handleDeleteChat = (chatId) => {
    deleteChat(chatId);
    if (chatId === activeChatId) {
      const remaining = getChats();
      if (remaining.length > 0) {
        handleSelectChat(remaining[0].id);
      } else {
        const newChat = createNewChat();
        refreshChats(newChat.id);
      }
    } else {
      setChats(getChats());
    }
  };

  const handlePlanChange = (planId) => {
    setSelectedPlanId(planId);
    if (activeChat) {
      const allChats = getChats();
      const idx = allChats.findIndex((c) => c.id === activeChat.id);
      if (idx !== -1) {
        allChats[idx].selectedPlanId = planId;
        saveChats(allChats);
      }
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || !activeChat) return;

    setError("");
    const userMsg = { role: "user", content: trimmed };
    const newMessages = [...activeChat.messages, userMsg];

    const updatedChat = { ...activeChat, messages: newMessages };
    setActiveChat(updatedChat);
    setInput("");
    setLoading(true);

    updateChat(activeChat.id, newMessages);

    try {
      const geminiResult = await analyzeSymptom({
        userMessage: trimmed,
        specialties: seedData.specialties
      });

      const validSpecialtyIds = seedData.specialties.map((s) => s.id);
      const safeResult = validSpecialtyIds.includes(geminiResult.specialtyId)
        ? geminiResult
        : { ...FALLBACK };

      const { hospitals } = estimateCoverage({
        specialtyId: safeResult.specialtyId,
        planId: selectedPlanId,
        seedData
      });

      const plan = seedData.insurancePlans.find((p) => p.id === selectedPlanId);
      const planName = plan?.name || selectedPlanId;

      let botContent = "";

      if (safeResult.emergencyWarning) {
        botContent +=
          "⚠️ Por los síntomas que describes, podría ser importante buscar atención médica inmediata o comunicarte con emergencias.\n\n";
      }

      botContent += `Según lo que me cuentas, la especialidad recomendada sería **${safeResult.specialtyName}**.\n\n`;
      botContent += `Tu plan seleccionado: **${planName}**.\n\n`;
      botContent += safeResult.patientExplanation;

      if (hospitals.length === 0) {
        botContent += "\n\nNo encontré hospitales de la red con esta especialidad en los datos actuales.";
      }

      const botMsg = { role: "assistant", content: botContent };
      const finalMessages = [...newMessages, botMsg];

      const resultData = {
        symptom: trimmed,
        specialtyId: safeResult.specialtyId,
        specialtyName: safeResult.specialtyName,
        confidence: safeResult.confidence,
        emergencyWarning: safeResult.emergencyWarning,
        hospitals,
        planName
      };

      updateChat(activeChat.id, finalMessages, resultData);
      const allChats = getChats();
      setChats(allChats);
      const found = allChats.find((c) => c.id === activeChat.id);
      setActiveChat(found || null);
    } catch (err) {
      let errMsg = "No pude analizar el síntoma en este momento. Puedes intentar escribirlo de otra forma.";
      if (err.message === "API_KEY_MISSING") {
        errMsg = "Falta configurar la API key de Gemini en el archivo .env (VITE_GEMINI_API_KEY).";
      }
      setError(errMsg);
      const errBotMsg = { role: "assistant", content: errMsg };
      const finalMessages = [...newMessages, errBotMsg];
      updateChat(activeChat.id, finalMessages);
      const allChats = getChats();
      setChats(allChats);
      const found = allChats.find((c) => c.id === activeChat.id);
      setActiveChat(found || null);
    } finally {
      setLoading(false);
    }
  };

  const activePlan = seedData?.insurancePlans?.find((p) => p.id === selectedPlanId);

  return (
    <div className="app-layout">
      <SidebarHistory
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
      />

      <main className="chat-main">
        <header className="chat-header">
          <h1>Estimador de Copago y Cobertura</h1>
          <button className="btn-reset" onClick={handleNewChat}>
            Reiniciar chat
          </button>
        </header>

        {seedData && (
          <PlanSelector
            plans={seedData.insurancePlans}
            selectedPlanId={selectedPlanId}
            onChange={handlePlanChange}
          />
        )}

        <div className="messages-container">
          {activeChat?.messages?.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}

          {loading && (
            <div className="chat-message assistant">
              <div className="message-bubble loading-bubble">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            </div>
          )}

          {activeChat?.result && !loading && (
            <ResultCard
              result={activeChat.result}
              planName={activePlan?.name || selectedPlanId}
            />
          )}

          <div ref={messagesEndRef} />
        </div>

        {error && <div className="error-banner">{error}</div>}

        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          loading={loading}
        />
      </main>
    </div>
  );
}
