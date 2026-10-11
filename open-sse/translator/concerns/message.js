import { OPENAI_BLOCK } from "../schema/index.js";

// Collapse an OpenAI content-part array: a lone text part becomes a plain string,
// otherwise the array is returned as-is. Matches existing translator behavior.
export function collapseTextParts(parts) {
  const only = parts.length === 1 ? parts[0] : null;
  // A marked text part must keep its block form — a bare string cannot carry cache_control.
  return only?.type === OPENAI_BLOCK.TEXT && !only.cache_control ? only.text : parts;
}
