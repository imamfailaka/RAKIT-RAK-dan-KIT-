export type Tone = "ok" | "warn" | "danger" | "info" | "neutral";

export const equipmentStatusTone = (status: string): Tone =>
  status === "available" ? "ok" : status === "borrowed" ? "info" : "neutral";

export const conditionTone = (condition: string): Tone =>
  condition === "good" ? "ok" : condition === "broken" ? "danger" : condition === "repair" ? "warn" : "neutral";
