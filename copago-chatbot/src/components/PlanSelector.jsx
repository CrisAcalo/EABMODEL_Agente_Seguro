export default function PlanSelector({ plans, selectedPlanId, onChange }) {
  return (
    <div className="plan-selector">
      <span className="plan-label">Tu plan:</span>
      {plans.map((plan) => (
        <button
          key={plan.id}
          className={`btn-plan ${selectedPlanId === plan.id ? "selected" : ""}`}
          onClick={() => onChange(plan.id)}
        >
          {plan.name}
        </button>
      ))}
    </div>
  );
}
