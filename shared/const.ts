export const COOKIE_NAME = "kuchikomi_session";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const UNAUTHED_ERR_MSG = "ログインが必要です (10001)";
export const NOT_ADMIN_ERR_MSG = "管理者権限が必要です (10002)";

export const PLAN_NAMES = {
  light: "LIGHTプラン",
  standard: "STANDARDプラン",
  premium: "PREMIUMプラン",
} as const;

export const PLAN_PRICES = {
  monthly: { light: 980, standard: 1980, premium: 4980 },
  yearly: { light: 9800, standard: 19800, premium: 49800 },
} as const;

export const INDUSTRIES = [
  "飲食店（レストラン・カフェ）",
  "美容院・ヘアサロン",
  "整体院・マッサージ",
  "歯科医院",
  "クリニック・病院",
  "ネイルサロン",
  "エステサロン",
  "フィットネスジム",
  "ペットショップ・トリミング",
  "学習塾・スクール",
  "不動産",
  "自動車販売・修理",
  "ホテル・旅館",
  "小売店・雑貨店",
  "その他",
] as const;

export type PlanType = "light" | "standard" | "premium";
