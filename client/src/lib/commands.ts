export type CommandAction = 
  | { type: "NAVIGATE"; to: string }
  | { type: "OPEN_MODAL"; modal: "glossary" | "profile" | "team" }
  | { type: "PM"; user: string; msg: string }
  | { type: "UNKNOWN" };

export function handleCommand(input: string): CommandAction | null {
  if (!input.startsWith("^") && !input.startsWith("pm.")) return null;

  const cmd = input.trim().toLowerCase();

  if (cmd === "^t") return { type: "NAVIGATE", to: "/team" };
  if (cmd === "^g") return { type: "OPEN_MODAL", modal: "glossary" };
  if (cmd === "^p") return { type: "OPEN_MODAL", modal: "profile" };

  if (cmd.startsWith("pm.")) {
    const parts = cmd.replace("pm.", "").split(":");
    if (parts.length >= 2) {
      const user = parts[0].trim();
      const msg = parts.slice(1).join(":").trim();
      return { type: "PM", user, msg };
    }
  }

  return { type: "UNKNOWN" };
}
