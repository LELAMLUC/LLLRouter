#!/usr/bin/env node
// LLLRouter launcher for the packaged (npm/GitHub-release) build.
// The app itself is the Next standalone output in ./app: requiring
// custom-server.js first installs the real-IP sanitizing http wrapper, then
// server.js boots Next on PORT/HOSTNAME.
const path = require("node:path");
const os = require("node:os");

const DEFAULT_PORT = 20228;
const DEFAULT_HOST = "127.0.0.1";

const USAGE = `LLLRouter — local AI gateway dashboard

Usage: lllrouter [options]

Options:
  -p, --port <port>   port to listen on (default ${DEFAULT_PORT}, env PORT)
      --host <host>   interface to bind (default ${DEFAULT_HOST}, env HOSTNAME)
  -v, --version       print version
  -h, --help          print this help

The dashboard opens with no login, so the default bind is loopback only.
Use --host 0.0.0.0 to expose it on your network.`;

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") opts.help = true;
    else if (arg === "-v" || arg === "--version") opts.version = true;
    else if (arg === "-p" || arg === "--port") opts.port = argv[++i];
    else if (arg.startsWith("--port=")) opts.port = arg.slice("--port=".length);
    else if (arg === "--host") opts.host = argv[++i];
    else if (arg.startsWith("--host=")) opts.host = arg.slice("--host=".length);
    else throw new Error(`unknown option: ${arg}`);
  }
  return opts;
}

function resolvePort(value) {
  if (value == null || value === "") return DEFAULT_PORT;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`invalid port: ${value}`);
  }
  return port;
}

function dataDir() {
  if (process.platform === "win32") {
    const appData = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
    return path.join(appData, "lllrouter");
  }
  return path.join(os.homedir(), ".lllrouter");
}

let opts;
try {
  opts = parseArgs(process.argv.slice(2));
} catch (error) {
  console.error(`lllrouter: ${error.message}\n`);
  console.error(USAGE);
  process.exit(1);
}

if (opts.help) {
  console.log(USAGE);
  process.exit(0);
}

const pkg = require("./package.json");
if (opts.version) {
  console.log(pkg.version);
  process.exit(0);
}

let port;
try {
  port = resolvePort(opts.port ?? process.env.PORT);
} catch (error) {
  console.error(`lllrouter: ${error.message}`);
  process.exit(1);
}

const host = opts.host || process.env.HOSTNAME || DEFAULT_HOST;
process.env.PORT = String(port);
process.env.HOSTNAME = host;

console.log(`LLLRouter v${pkg.version} → http://${host}:${port}`);
console.log(`data: ${process.env.DATA_DIR || dataDir()}`);

require(path.join(__dirname, "app", "custom-server.js"));
require(path.join(__dirname, "app", "server.js"));
