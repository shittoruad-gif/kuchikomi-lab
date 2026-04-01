export const STRIPE_PRODUCTS = {
  light: {
    name: "LIGHTプラン",
    priceId: process.env.STRIPE_PRICE_LIGHT ?? "price_light_placeholder",
    price: 980,
    currency: "jpy",
    interval: "month" as const,
    features: [
      "月30回まで生成",
      "業種選択のみ",
      "質問数5問固定",
      "Google口コミ1パターン生成",
    ],
  },
  standard: {
    name: "STANDARDプラン",
    priceId: process.env.STRIPE_PRICE_STANDARD ?? "price_standard_placeholder",
    price: 1980,
    currency: "jpy",
    interval: "month" as const,
    features: [
      "月100回まで生成",
      "業種別テンプレート",
      "目的別口コミ生成（初回/リピート/接客）",
      "トーン選択（丁寧/親しみ/専門性）",
    ],
  },
  premium: {
    name: "PREMIUMプラン",
    priceId: process.env.STRIPE_PRICE_PREMIUM ?? "price_premium_placeholder",
    price: 4980,
    currency: "jpy",
    interval: "month" as const,
    features: [
      "月300回まで生成",
      "店舗ごとの質問完全カスタム",
      "自由記述・高度最適化",
      "複数パターン同時生成",
    ],
  },
};

export const PLAN_LIMITS = {
  light: {
    monthlyGenerationsLimit: 30,
    maxQuestionsCount: 5,
    canCustomizeQuestions: false,
    canSelectPurpose: false,
    canSelectTone: false,
    canUseFreeText: false,
    maxGenerationPatterns: 1,
  },
  standard: {
    monthlyGenerationsLimit: 100,
    maxQuestionsCount: 10,
    canCustomizeQuestions: false,
    canSelectPurpose: true,
    canSelectTone: true,
    canUseFreeText: false,
    maxGenerationPatterns: 3,
  },
  premium: {
    monthlyGenerationsLimit: 300,
    maxQuestionsCount: 20,
    canCustomizeQuestions: true,
    canSelectPurpose: true,
    canSelectTone: true,
    canUseFreeText: true,
    maxGenerationPatterns: 5,
  },
};
