export const themes = ["morning", "afternoon", "sunset", "night"] as const;
export type Theme = (typeof themes)[number];
export type Preference = Theme | "auto";
export const themeCopy: Record<
  Theme,
  { time: string; line: string; symbol: string }
> = {
  morning: {
    time: "05:00 — 11:00",
    line: "Begin with possibility.",
    symbol: "◒",
  },
  afternoon: {
    time: "11:00 — 16:30",
    line: "Create without limits.",
    symbol: "☀",
  },
  sunset: { time: "16:30 — 19:30", line: "Let ideas come alive.", symbol: "◓" },
  night: {
    time: "19:30 — 05:00",
    line: "Dream beyond the ordinary.",
    symbol: "☾",
  },
};
