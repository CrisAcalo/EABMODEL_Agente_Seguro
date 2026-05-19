export const seedData = {
  specialties: [
    {
      id: "medicina_general",
      name: "Medicina General",
      keywords: ["dolor leve", "fiebre", "malestar", "tos", "gripe", "control general"]
    },
    {
      id: "traumatologia",
      name: "Traumatología",
      keywords: ["golpe", "fractura", "dolor de rodilla", "dolor de espalda", "lesión", "torcedura"]
    },
    {
      id: "cardiologia",
      name: "Cardiología",
      keywords: ["dolor de pecho", "palpitaciones", "presión alta", "falta de aire"]
    },
    {
      id: "gastroenterologia",
      name: "Gastroenterología",
      keywords: ["dolor abdominal", "gastritis", "reflujo", "náuseas", "diarrea"]
    },
    {
      id: "dermatologia",
      name: "Dermatología",
      keywords: ["manchas", "acné", "picazón", "erupción", "piel", "alergia en piel"]
    },
    {
      id: "ginecologia",
      name: "Ginecología",
      keywords: ["dolor pélvico", "control ginecológico", "embarazo", "menstruación"]
    },
    {
      id: "pediatria",
      name: "Pediatría",
      keywords: ["niño", "bebé", "fiebre infantil", "control pediátrico"]
    }
  ],

  hospitals: [
    {
      id: "hospital_central",
      name: "Hospital Central",
      city: "Quito",
      networkLevel: "preferente",
      baseConsultationCost: 60,
      specialties: [
        "medicina_general",
        "traumatologia",
        "cardiologia",
        "gastroenterologia",
        "dermatologia"
      ]
    },
    {
      id: "clinica_norte",
      name: "Clínica Norte",
      city: "Quito",
      networkLevel: "regular",
      baseConsultationCost: 50,
      specialties: [
        "medicina_general",
        "traumatologia",
        "dermatologia",
        "pediatria"
      ]
    },
    {
      id: "centro_medico_sur",
      name: "Centro Médico Sur",
      city: "Quito",
      networkLevel: "economico",
      baseConsultationCost: 40,
      specialties: [
        "medicina_general",
        "gastroenterologia",
        "ginecologia",
        "pediatria"
      ]
    }
  ],

  insurancePlans: [
    {
      id: "basico",
      name: "Plan Básico",
      monthlyLabel: "Cobertura esencial",
      coverageRules: {
        preferente: 0.5,
        regular: 0.4,
        economico: 0.6
      },
      specialtyAdjustments: {
        medicina_general: 0.1,
        cardiologia: -0.05,
        traumatologia: -0.05
      },
      minCopay: 15
    },
    {
      id: "plus",
      name: "Plan Plus",
      monthlyLabel: "Cobertura ampliada",
      coverageRules: {
        preferente: 0.75,
        regular: 0.65,
        economico: 0.8
      },
      specialtyAdjustments: {
        medicina_general: 0.05,
        cardiologia: 0,
        traumatologia: 0
      },
      minCopay: 10
    },
    {
      id: "premium",
      name: "Plan Premium",
      monthlyLabel: "Mayor cobertura hospitalaria",
      coverageRules: {
        preferente: 0.9,
        regular: 0.85,
        economico: 0.9
      },
      specialtyAdjustments: {
        medicina_general: 0,
        cardiologia: 0,
        traumatologia: 0
      },
      minCopay: 5
    }
  ]
};
