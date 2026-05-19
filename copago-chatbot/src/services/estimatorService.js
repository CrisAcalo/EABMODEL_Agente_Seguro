export function estimateCoverage({ specialtyId, planId, seedData }) {
  const plan = seedData.insurancePlans.find((p) => p.id === planId);
  if (!plan) return { hospitals: [], bestOption: null };

  const availableHospitals = seedData.hospitals.filter((h) =>
    h.specialties.includes(specialtyId)
  );

  if (availableHospitals.length === 0) return { hospitals: [], bestOption: null };

  const adjustment = plan.specialtyAdjustments?.[specialtyId] ?? 0;

  const results = availableHospitals.map((hospital) => {
    const baseCost = hospital.baseConsultationCost;
    const basePercent = plan.coverageRules[hospital.networkLevel] ?? 0;
    let coveragePercent = basePercent + adjustment;
    coveragePercent = Math.max(0, Math.min(0.95, coveragePercent));

    const coveredAmount = baseCost * coveragePercent;
    const rawCopay = baseCost - coveredAmount;
    const estimatedCopay = Math.max(plan.minCopay, rawCopay);

    return {
      hospitalId: hospital.id,
      hospitalName: hospital.name,
      city: hospital.city,
      networkLevel: hospital.networkLevel,
      baseConsultationCost: baseCost,
      coveragePercent: Math.round(coveragePercent * 100),           // % stays as integer
      coveredAmount: Math.round(coveredAmount * 100) / 100,         // 2 decimal places
      estimatedCopay: Math.round(estimatedCopay * 100) / 100,       // 2 decimal places
      isBestOption: false
    };
  });

  results.sort((a, b) => a.estimatedCopay - b.estimatedCopay);
  if (results.length > 0) results[0].isBestOption = true;

  return { hospitals: results, bestOption: results[0] };
}
