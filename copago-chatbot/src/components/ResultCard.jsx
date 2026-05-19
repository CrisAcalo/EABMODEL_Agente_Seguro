const NETWORK_LABELS = {
  preferente: "Preferente",
  regular: "Regular",
  economico: "Económico"
};

export default function ResultCard({ result, planName }) {
  if (!result || !result.hospitals || result.hospitals.length === 0) return null;

  const best = result.hospitals.find((h) => h.isBestOption);
  const others = result.hospitals.filter((h) => !h.isBestOption);

  return (
    <div className="result-card">
      {result.emergencyWarning && (
        <div className="emergency-banner">
          ⚠️ Por los síntomas que describes, podría ser importante buscar atención médica inmediata o comunicarte con emergencias.
        </div>
      )}

      <div className="result-header">
        <span className="result-specialty-badge">{result.specialtyName}</span>
        <span className="result-plan-badge">{planName}</span>
      </div>

      {best && (
        <div className="result-best">
          <div className="result-best-label">✅ Mejor opción económica</div>
          <div className="result-hospital-name">{best.hospitalName}</div>
          <div className="result-hospital-city">{best.city} · Red {NETWORK_LABELS[best.networkLevel]}</div>
          <div className="result-copay">
            Copago estimado: <strong>${best.estimatedCopay.toFixed(2)}</strong>
          </div>
          <div className="result-coverage">
            Seguro cubre: <strong>${best.coveredAmount.toFixed(2)}</strong> ({best.coveragePercent}%)
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div className="result-others">
          <div className="result-others-label">Otras opciones:</div>
          {others.map((h) => (
              <div key={h.hospitalId} className="result-other-item">
                <span>{h.hospitalName}</span>
                <span>— Copago: <strong>${h.estimatedCopay.toFixed(2)}</strong> · Cubre: {h.coveragePercent}%</span>
              </div>
          ))}
        </div>
      )}

      <div className="result-disclaimer">
        Esta es una estimación referencial basada en los datos cargados en la app. No reemplaza una confirmación oficial del seguro ni una valoración médica.
      </div>
    </div>
  );
}
