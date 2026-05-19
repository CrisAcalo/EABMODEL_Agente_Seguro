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
  getActiveChatId,
} from "./services/storageService";
import { analyzeSymptom, FALLBACK_RECOMMENDATION } from "./services/geminiService";
import { estimateCoverage } from "./services/estimatorService";

import SidebarHistory from "./components/SidebarHistory";
import PlanSelector from "./components/PlanSelector";
import ChatMessage from "./components/ChatMessage";
import ChatInput from "./components/ChatInput";
import ResultCard from "./components/ResultCard";
import InfoView from "./components/InfoView";
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
  const [activeView, setActiveView] = useState("chat");
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
    setActiveView("chat");
  };

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    setActiveChatIdState(chatId);
    const found = getChats().find((c) => c.id === chatId);
    setActiveChat(found || null);
    if (found) setSelectedPlanId(found.selectedPlanId || "plus");
    setError("");
    setActiveView("chat");
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

    setActiveChat({ ...activeChat, messages: newMessages });
    setInput("");
    setLoading(true);
    updateChat(activeChat.id, newMessages);

    try {
      const geminiResult = await analyzeSymptom({
        messages: newMessages,
        specialties: seedData.specialties,
      });

      if (geminiResult.type === "question") {
        // Bot is asking for more info — no coverage estimation yet
        const botMsg = { role: "assistant", content: geminiResult.message };
        const finalMessages = [...newMessages, botMsg];
        updateChat(activeChat.id, finalMessages);
        const allChats = getChats();
        setChats(allChats);
        setActiveChat(allChats.find((c) => c.id === activeChat.id) || null);
      } else {
        // type === "recommendation" — run coverage estimation
        const validSpecialtyIds = seedData.specialties.map((s) => s.id);
        const safeResult = validSpecialtyIds.includes(geminiResult.specialtyId)
          ? geminiResult
          : { ...FALLBACK_RECOMMENDATION };

        const { hospitals } = estimateCoverage({
          specialtyId: safeResult.specialtyId,
          planId: selectedPlanId,
          seedData,
        });

        const plan = seedData.insurancePlans.find((p) => p.id === selectedPlanId);
        const planName = plan?.name || selectedPlanId;

        let botContent = "";

        if (safeResult.emergencyWarning) {
          botContent +=
            "⚠️ Por los síntomas que describes, podría ser importante buscar atención médica inmediata o comunicarte con emergencias.\n\n";
        }

        // Only static info in the bubble: specialty + clinical explanation + best hospital.
        // Plan name and financial values are intentionally excluded — they live in the
        // ResultCard which recalculates dynamically whenever the user changes the plan.
        botContent += `Según lo que me cuentas, la especialidad recomendada sería **${safeResult.specialtyName}**.\n\n`;
        botContent += safeResult.patientExplanation;

        if (hospitals.length === 0) {
          botContent +=
            "\n\nNo encontré hospitales de la red con esta especialidad en los datos actuales.";
        } else {
          const best = hospitals[0];
          botContent += `\n\n🏥 **Hospital recomendado:** ${best.hospitalName} (Red ${best.networkLevel})\n`;
          botContent += `Revisa abajo el detalle de copago y cobertura según tu plan seleccionado.`;
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
          planName,
        };

        updateChat(activeChat.id, finalMessages, resultData);
        const allChats = getChats();
        setChats(allChats);
        setActiveChat(allChats.find((c) => c.id === activeChat.id) || null);
      }
    } catch (err) {
      let errMsg =
        "No pude analizar el síntoma en este momento. Puedes intentar escribirlo de otra forma.";
      if (err.message === "API_KEY_MISSING") {
        errMsg = "Falta configurar la API key de Gemini en el archivo .env (VITE_GEMINI_API_KEY).";
      } else if (err.message.startsWith("API_ERROR")) {
        errMsg = `Error del servidor: ${err.message}`;
      }
      setError(errMsg);
      const errBotMsg = { role: "assistant", content: errMsg };
      const finalMessages = [...newMessages, errBotMsg];
      updateChat(activeChat.id, finalMessages);
      const allChats = getChats();
      setChats(allChats);
      setActiveChat(allChats.find((c) => c.id === activeChat.id) || null);
    } finally {
      setLoading(false);
    }
  };

  const activePlan = seedData?.insurancePlans?.find((p) => p.id === selectedPlanId);

  // Recalculate hospitals live whenever selectedPlanId changes, so the ResultCard
  // always reflects the currently selected plan — not the cached snapshot.
  const liveResult = (() => {
    if (!activeChat?.result?.specialtyId || !seedData) return null;
    const { hospitals } = estimateCoverage({
      specialtyId: activeChat.result.specialtyId,
      planId: selectedPlanId,
      seedData,
    });
    return {
      ...activeChat.result,
      hospitals,
      planName: activePlan?.name || selectedPlanId,
    };
  })();

  return (
    <div className="app-layout">
      <SidebarHistory
        chats={chats}
        activeChatId={activeChatId}
        activeView={activeView}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onViewChange={setActiveView}
      />

      <main className="chat-main">
        {activeView === "info" ? (
          <InfoView seedData={seedData} />
        ) : (
          <>
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

              {liveResult && !loading && (
                <ResultCard
                  result={liveResult}
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
          </>
        )}
      </main>
    </div>
  );
}
