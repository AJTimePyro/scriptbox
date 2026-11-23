// Design tokens shared with Monaco, which needs raw hex values in JS.

export const TOKENS = {
  colors: {
    bgBase: "#0B0D0E",
    surface: "#111416",
    elevated: "#171B1E",
    border: "#232A2E",
    borderSubtle: "#1A2024",
    text: "#E4E8E6",
    textMuted: "#8A9490",
    textFaint: "#55605C",
    accent: "#B5F23D",
    accentFg: "#0B0D0E",
    error: "#FF6B6B",
    warning: "#F5B14C",
  },
  // Syntax colors chosen for contrast on the #111416 editor background.
  syntax: {
    keyword: "#F2A66B",
    string: "#A8D672",
    number: "#7FD4E0",
    function: "#8DB8FF",
    comment: "#5E6B66",
    operator: "#9AA5A0",
    variable: "#E4E8E6",
  },
} as const;
