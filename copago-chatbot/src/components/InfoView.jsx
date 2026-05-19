import { useState } from "react";

const NETWORK_LABELS = {
  preferente: "Preferente",
  regular: "Regular",
  economico: "Económico",
};

const SPECIALTY_ICONS = {
  medicina_general: "🩺",
  traumatologia: "🦴",
  cardiologia: "❤️",
  gastroenterologia: "🫁",
  dermatologia: "🧴",
  ginecologia: "👶",
  pediatria: "🧒",
};

export default function InfoView({ seedData }) {
  const [activeTab, setActiveTab] = useState("hospitals");
  const [selectedPlans, setSelectedPlans] = useState(
    () => seedData?.insurancePlans.map((p) => p.id) ?? []
  );
  const [simCost, setSimCost] = useState(60);

  if (!seedData) {
    return <div className="info-loading">Cargando información...</div>;
  }

  const togglePlan = (planId) => {
    setSelectedPlans((prev) => {
      if (prev.includes(planId)) {
        // Always keep at least one plan selected
        return prev.length > 1 ? prev.filter((id) => id !== planId) : prev;
      }
      return [...prev, planId];
    });
  };

  const visiblePlans = seedData.insurancePlans.filter((p) =>
    selectedPlans.includes(p.id)
  );
  const networkLevels = ["preferente", "regular", "economico"];

  return (
    <div className="info-view">
      {/* Header */}
      <header className="info-header">
        <h1>Información del Sistema</h1>
        <p className="info-subtitle">
          Consulta las especialidades disponibles en cada hospital y compara los
          beneficios de cada plan de cobertura.
        </p>
      </header>

      {/* Tabs */}
      <div className="info-tabs">
        <button
          className={`info-tab ${activeTab === "hospitals" ? "active" : ""}`}
          onClick={() => setActiveTab("hospitals")}
        >
          🏥 Hospitales y Especialidades
        </button>
        <button
          className={`info-tab ${activeTab === "plans" ? "active" : ""}`}
          onClick={() => setActiveTab("plans")}
        >
          📊 Comparativa de Planes
        </button>
      </div>

      <div className="info-content">
        {/* ── TAB: HOSPITALS ── */}
        {activeTab === "hospitals" && (
          <div className="hospitals-grid">
            {seedData.hospitals.map((hospital) => {
              const hospitalSpecialties = seedData.specialties.filter((s) =>
                hospital.specialties.includes(s.id)
              );
              return (
                <div key={hospital.id} className="hospital-card">
                  <div className="hospital-card-header">
                    <div>
                      <div className="hospital-name">{hospital.name}</div>
                      <div className="hospital-city">📍 {hospital.city}</div>
                    </div>
                    <span className={`network-badge network-${hospital.networkLevel}`}>
                      Red {NETWORK_LABELS[hospital.networkLevel]}
                    </span>
                  </div>

                  <div className="hospital-cost">
                    Consulta base:{" "}
                    <strong>${hospital.baseConsultationCost}</strong>
                  </div>

                  <div className="hospital-specialties-label">
                    Especialidades disponibles:
                  </div>
                  <div className="hospital-specialties">
                    {hospitalSpecialties.map((s) => (
                      <span key={s.id} className="specialty-chip">
                        {SPECIALTY_ICONS[s.id] ?? "🔬"} {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── TAB: PLANS ── */}
        {activeTab === "plans" && (
          <div className="plans-section">
            {/* Plan toggles */}
            <div className="plan-toggles-row">
              <span className="plan-toggles-label">Planes a comparar:</span>
              <div className="plan-toggles">
                {seedData.insurancePlans.map((plan) => (
                  <button
                    key={plan.id}
                    className={`plan-toggle-btn ${
                      selectedPlans.includes(plan.id) ? "selected" : ""
                    }`}
                    onClick={() => togglePlan(plan.id)}
                  >
                    {plan.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Coverage table */}
            <div className="table-wrapper">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th>Característica</th>
                    {visiblePlans.map((p) => (
                      <th key={p.id} className={`col-plan col-${p.id}`}>
                        {p.name}
                        <div className="plan-th-sub">{p.monthlyLabel}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="section-row">
                    <td colSpan={visiblePlans.length + 1}>
                      Cobertura por nivel de red
                    </td>
                  </tr>
                  {networkLevels.map((level) => (
                    <tr key={level}>
                      <td>
                        <span className={`network-badge network-${level} small`}>
                          Red {NETWORK_LABELS[level]}
                        </span>
                      </td>
                      {visiblePlans.map((plan) => (
                        <td key={plan.id} className="coverage-cell">
                          <span className="coverage-pct">
                            {Math.round(
                              (plan.coverageRules[level] ?? 0) * 100
                            )}
                            %
                          </span>
                          <span className="coverage-sub">cubierto</span>
                        </td>
                      ))}
                    </tr>
                  ))}

                  <tr className="section-row">
                    <td colSpan={visiblePlans.length + 1}>
                      Ajustes por especialidad
                    </td>
                  </tr>
                  {seedData.specialties.map((spec) => {
                    const hasAnyAdjust = visiblePlans.some(
                      (p) =>
                        p.specialtyAdjustments?.[spec.id] !== undefined &&
                        p.specialtyAdjustments[spec.id] !== 0
                    );
                    if (!hasAnyAdjust) return null;
                    return (
                      <tr key={spec.id}>
                        <td>
                          {SPECIALTY_ICONS[spec.id] ?? "🔬"} {spec.name}
                        </td>
                        {visiblePlans.map((plan) => {
                          const adj = plan.specialtyAdjustments?.[spec.id];
                          if (adj === undefined || adj === 0) {
                            return (
                              <td key={plan.id} className="adj-cell neutral">
                                —
                              </td>
                            );
                          }
                          return (
                            <td
                              key={plan.id}
                              className={`adj-cell ${adj > 0 ? "positive" : "negative"}`}
                            >
                              {adj > 0 ? "+" : ""}
                              {Math.round(adj * 100)}%
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}

                  <tr className="section-row">
                    <td colSpan={visiblePlans.length + 1}>Copago mínimo</td>
                  </tr>
                  <tr>
                    <td>Copago mínimo garantizado</td>
                    {visiblePlans.map((plan) => (
                      <td key={plan.id} className="coverage-cell">
                        <span className="coverage-pct">${plan.minCopay}</span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Copay simulator */}
            <div className="sim-card">
              <div className="sim-title">🧮 Simulador de Copago</div>
              <div className="sim-subtitle">
                Ajusta el costo de consulta y el nivel de red para ver cuánto
                pagarías con cada plan.
              </div>

              <div className="sim-controls">
                <label className="sim-label">
                  Costo de consulta: <strong>${simCost}</strong>
                </label>
                <input
                  type="range"
                  min={20}
                  max={200}
                  step={5}
                  value={simCost}
                  onChange={(e) => setSimCost(Number(e.target.value))}
                  className="sim-slider"
                />
              </div>

              <div className="sim-results">
                {networkLevels.map((level) => (
                  <div key={level} className="sim-row">
                    <div className="sim-level">
                      <span className={`network-badge network-${level} small`}>
                        Red {NETWORK_LABELS[level]}
                      </span>
                    </div>
                    <div className="sim-plans">
                      {visiblePlans.map((plan) => {
                        const pct = Math.min(
                          0.95,
                          plan.coverageRules[level] ?? 0
                        );
                        const covered = simCost * pct;
                        const copay = Math.max(
                          plan.minCopay,
                          simCost - covered
                        );
                        return (
                          <div key={plan.id} className="sim-plan-item">
                            <div className="sim-plan-name">{plan.name}</div>
                            <div className="sim-copay">
                              Copago: <strong>${copay.toFixed(2)}</strong>
                            </div>
                            <div className="sim-covered">
                              Cubre: ${covered.toFixed(2)} ({Math.round(pct * 100)}%)
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
