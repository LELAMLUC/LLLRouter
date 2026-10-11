# LLLRouter

Local AI gateway dashboard — one binary-free package, no build step, no repo checkout.

```bash
npm install -g lllrouter-0.1.0.tgz
lllrouter
```

Then open the dashboard at <http://127.0.0.1:20228> (printed on startup).

## Options

```
-p, --port <port>   port to listen on (default 20228, env PORT)
    --host <host>   interface to bind (default 127.0.0.1, env HOSTNAME)
-v, --version       print version
-h, --help          print help
```

The dashboard has no login, so the default bind is loopback only. Use
`--host 0.0.0.0` to expose it on your network.

## Data

Settings, providers, keys and usage live outside the package in:

- Windows: `%APPDATA%\lllrouter`
- macOS / Linux: `~/.lllrouter`

Override with `DATA_DIR`. Copying that directory (or just `db/data.sqlite`)
moves your setup to another machine.

## Requirements

Node.js >= 20.9. Node 22.5+ is recommended: it uses the built-in `node:sqlite`,
older versions fall back to the bundled `sql.js`.
