/**
 * Detect CLI tool identity from request headers/body.
 * Used to determine if a request can be passed through losslessly.
 */

// Map of CLI tool identifiers to provider IDs they are "native" to
const NATIVE_PAIRS = {
  "claude": ["claude", "anthropic"],
  "gemini-cli": ["gemini-cli"],
  "antigravity": ["antigravity"],
  "codex": ["codex"],
};

// Same native pairs, keyed by the client's wire format instead of its identity:
// a request already in the provider's own format is lossless whatever UA sent it,
// so it must not be detected through headers alone (any Anthropic-format client
// that is not Claude Code was previously rewritten by the translator).
// Gemini format is absent on purpose — gemini-cli wraps the body in its own
// envelope, so source "gemini" is not the format that endpoint accepts.
const NATIVE_FORMAT_PAIRS = {
  claude: ["claude", "anthropic"],
  "openai-responses": ["codex"],
  antigravity: ["antigravity"],
};

/**
 * Detect which CLI tool is making the request.
 * Returns one of: "claude" | "gemini-cli" | "antigravity" | "codex" | null
 * @param {object} headers - Lowercase header key/value object
 * @param {object} body    - Parsed request body
 */
export function detectClientTool(headers = {}, body = {}) {
  const ua = (headers["user-agent"] || "").toLowerCase();
  const xApp = (headers["x-app"] || "").toLowerCase();
  const openaiIntent = (headers["openai-intent"] || "").toLowerCase();
  const initiator = (headers["x-initiator"] || headers["X-Initiator"] || "").toLowerCase();
  const originator = (headers["originator"] || "").toLowerCase();

  // Antigravity: detected via body field (not header)
  if (body.userAgent === "antigravity") return "antigravity";

  // GitHub Copilot / OAI compatible extension using Copilot chat headers
  if (ua.includes("githubcopilotchat") || openaiIntent === "conversation-panel" || initiator === "user") {
    return "github-copilot";
  }

  // Claude Code / Claude CLI
  if (ua.includes("claude-cli") || ua.includes("claude-code") || xApp === "cli") return "claude";

  // Gemini CLI
  if (ua.includes("gemini-cli")) return "gemini-cli";

  // Codex CLI/Desktop — codex-tui is the current Rust CLI, codex-cli/codex_cli_rs legacy;
  // Codex Desktop identifies via UA "Codex Desktop" or originator "codex_work_desktop"
  if (ua.includes("codex-tui") || ua.includes("codex-cli") || ua.includes("codex_cli_rs") ||
      ua.includes("codex desktop") || originator.startsWith("codex_")) return "codex";

  // DeepSeek TUI
  if (ua.includes("deepseek-tui")) return "deepseek-tui";

  return null;
}

/**
 * Check if this CLI tool + provider pair should be passed through losslessly.
 * @param {string|null} clientTool - Result of detectClientTool()
 * @param {string} provider        - Provider ID (e.g. "claude", "gemini-cli")
 */
export function isNativePassthrough(clientTool, provider) {
  if (!clientTool) return false;
  const nativeProviders = NATIVE_PAIRS[clientTool];
  if (!nativeProviders) return false;
  // Support anthropic-compatible-* variants
  const normalizedProvider = provider.startsWith("anthropic-compatible")
    ? "anthropic"
    : provider;
  return nativeProviders.includes(normalizedProvider);
}

/**
 * Same-format passthrough: the client's wire format is already the one the provider
 * speaks (checked by the caller: sourceFormat === targetFormat), so the body can be
 * forwarded untouched no matter which client sent it.
 * @param {string} sourceFormat - Detected client format (FORMATS.*)
 * @param {string} provider     - Provider ID
 */
export function isNativeFormatPassthrough(sourceFormat, provider) {
  const nativeProviders = NATIVE_FORMAT_PAIRS[sourceFormat];
  if (!nativeProviders) return false;
  const normalizedProvider = provider.startsWith("anthropic-compatible")
    ? "anthropic"
    : provider;
  return nativeProviders.includes(normalizedProvider);
}
