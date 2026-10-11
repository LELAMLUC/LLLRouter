import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { PHASE_PRODUCTION_BUILD } from "next/constants.js";

// Build isolation: @vercel/nft (Next's file tracer) resolves the config paths the
// app discovers from os.homedir()/APPDATA/LOCALAPPDATA/tmpdir and then walks every
// match. On a real user profile that means gigabytes of memory, the developer's own
// config files inside the standalone trace, and on Windows a hard failure as soon
// as one profile entry is unreadable (a stale temp dir owned by another account).
// Production builds therefore run against a throwaway profile, while the running app
// keeps the real one.
function isolateBuildProfile() {
  const buildHome = join(tmpdir(), "lllrouter-build-home");
  const buildAppData = join(buildHome, "AppData");
  const buildTemp = join(buildHome, "tmp");
  mkdirSync(join(buildAppData, "Local"), { recursive: true });
  mkdirSync(join(buildAppData, "Roaming"), { recursive: true });
  mkdirSync(buildTemp, { recursive: true });
  process.env.HOME = buildHome;
  process.env.USERPROFILE = buildHome;
  process.env.APPDATA = join(buildAppData, "Roaming");
  process.env.LOCALAPPDATA = join(buildAppData, "Local");
  process.env.TEMP = buildTemp;
  process.env.TMP = buildTemp;
  process.env.TMPDIR = buildTemp;
}

const projectRoot = dirname(fileURLToPath(import.meta.url));
// CLI bundling needs workspace root so tracing includes hoisted node_modules (slim ~50MB).
// Docker / default uses projectRoot so server.js lands at /app/server.js (not nested).
const tracingRoot = process.env.NEXT_TRACING_ROOT_MODE === "workspace"
  ? join(projectRoot, "..")
  : projectRoot;
const proxyClientMaxBodySize = process.env.NINEROUTER_PROXY_CLIENT_MAX_BODY_SIZE || "128mb";

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  output: "standalone",
  // `open` must stay external. It derives its own directory from `import.meta.url`, and
  // webpack replaces that with the absolute path of the BUILD machine as a string literal.
  // A release built on macOS therefore ships `file:///Users/.../open/index.js`, which
  // `fileURLToPath` rejects on Windows ("File URL path must be absolute" — no drive
  // letter). That throw happens at module scope, so every consumer of `open` dies on
  // import — including xAI/Grok token refresh, which loads the OAuth service that imports
  // it. Keeping it external preserves the real `import.meta.url` at runtime.
  // @aws-sdk/credential-providers must stay external for the same class of reason: it reads
  // ~/.aws/config and the SSO token cache from disk at runtime and resolves its credential
  // plugins by dynamic require, neither of which survives bundling.
  serverExternalPackages: ["better-sqlite3", "sql.js", "node:sqlite", "bun:sqlite", "open", "@aws-sdk/credential-providers"],
  turbopack: {
    root: tracingRoot
  },
  outputFileTracingRoot: tracingRoot,
  outputFileTracingExcludes: {
    "*": ["./gitbook/**/*"]
  },
  images: {
    unoptimized: true
  },
  env: {},
  experimental: {
    // #1529/#1572: LLM clients can send long context or base64 image payloads through /v1 rewrites.
    proxyClientMaxBodySize,
    // Cache fetch responses across HMR refreshes for faster dev reloads.
    serverComponentsHmrCache: true,
    // Tree-shake heavy barrel imports to cut compile + bundle size
    optimizePackageImports: ["@xyflow/react", "@dnd-kit/core", "@dnd-kit/sortable", "material-symbols", "marked"],
  },
  webpack: (config, { isServer }) => {
    // Ignore fs/path modules in browser bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    // Exclude non-source dirs from watcher to reduce inotify load
    config.watchOptions = {
      ...config.watchOptions,
      aggregateTimeout: 300,
      ignored: /[\\/](node_modules|\.git|logs|\.next|\.next-cli-build|gitbook|cli|open-sse\.old|tests|docs)[\\/]/,
    };
    return config;
  },
  async rewrites() {
    return [
      {
        source: "/v1/v1/:path*",
        destination: "/api/v1/:path*"
      },
      {
        source: "/v1/v1",
        destination: "/api/v1"
      },
      {
        source: "/codex/:path*",
        destination: "/api/v1/responses"
      },
      {
        source: "/responses",
        destination: "/api/v1/responses"
      },
      {
        source: "/v1/:path*",
        destination: "/api/v1/:path*"
      },
      {
        source: "/v1",
        destination: "/api/v1"
      }
    ];
  }
};

// The phase is the only reliable signal for "this load is a production build":
// NODE_ENV is also "production" for the standalone server (which must keep the real
// profile), and NEXT_PHASE is not set until deep inside the build.
export default function config(phase) {
  if (phase === PHASE_PRODUCTION_BUILD) isolateBuildProfile();
  return nextConfig;
}
