import os from "node:os";

// Keep os.tmpdir() behind an indirection: @vercel/nft statically resolves a
// direct os.tmpdir() call while tracing the server build and then walks the
// whole OS temp dir, which aborts `next build` as soon as one temp entry is
// unreadable (stale `.scratch` dirs owned by another user on Windows).
export function tempDir() {
  return os.tmpdir();
}
