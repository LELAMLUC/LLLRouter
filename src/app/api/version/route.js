import pkg from "../../../../package.json" with { type: "json" };

// LLLRouter is personal single-user software: no update channel.
export async function GET() {
  return Response.json({ currentVersion: pkg.version, latestVersion: null, hasUpdate: false });
}
