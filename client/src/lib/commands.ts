export type CommandAction = 
  | { type: "NAVIGATE"; to: string }
  | { type: "OPEN_MODAL"; modal: "glossary" | "profile" | "team" | "note" }
  | { type: "PM"; user: string; msg: string }
  | { type: "UNKNOWN" };

export function handleCommand(input: string): CommandAction | null {
  const cmd = input.trim().toLowerCase();

  // PDF: Keyboard shortcuts
  if (cmd === "^t") return { type: "NAVIGATE", to: "/team" };
  if (cmd === "^g") return { type: "OPEN_MODAL", modal: "glossary" };
  if (cmd === "^p") return { type: "OPEN_MODAL", modal: "profile" };
  if (cmd === "^n") return { type: "OPEN_MODAL", modal: "note" };

  // PDF: Private message command
  if (cmd.startsWith("pm.")) {
    const parts = cmd.replace("pm.", "").split(":");
    if (parts.length >= 2) {
      const user = parts[0].trim();
      const msg = parts.slice(1).join(":").trim();
      return { type: "PM", user, msg };
    }
  }

  if (input.startsWith("^") || input.startsWith("pm.")) {
    return { type: "UNKNOWN" };
  }

  return null;
}
