import http from "node:http";
import { promises as fs, watch } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PUBLIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");
const ASSETS = {
  "/": ["index.html", "text/html; charset=utf-8"],
  "/app.js": ["app.js", "text/javascript; charset=utf-8"],
  "/style.css": ["style.css", "text/css; charset=utf-8"],
};
const MAX_BODY = 4096;
const POLL_MS = 3000;

function sendJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error("Body too large."), { status: 413 }));
        req.destroy();
      } else chunks.push(c);
    });
    req.on("end", () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {});
      } catch {
        reject(Object.assign(new Error("Invalid JSON."), { status: 400 }));
      }
    });
    req.on("error", reject);
  });
}

/**
 * Watches <root>/.cor for changes. Uses fs.watch when available plus an mtime
 * poll, because directory watching is unreliable on some file systems and
 * agents often replace files atomically.
 */
export function watchCorDir(root, onChange) {
  const dir = path.join(root, ".cor");
  let timer = null;
  let watcher = null;
  let lastSig = "";
  const fire = () => {
    clearTimeout(timer);
    timer = setTimeout(onChange, 150);
  };
  const signature = async () => {
    try {
      const names = await fs.readdir(dir);
      const stats = await Promise.all(names.filter((n) => n.endsWith(".md")).map(async (n) => `${n}:${(await fs.stat(path.join(dir, n))).mtimeMs}`));
      return stats.sort().join("|");
    } catch {
      return "missing";
    }
  };
  const attach = () => {
    if (watcher) return;
    try {
      watcher = watch(dir, { persistent: false }, fire);
      watcher.on("error", () => {
        watcher?.close();
        watcher = null;
      });
    } catch {
      watcher = null;
    }
  };
  attach();
  signature().then((s) => (lastSig = s));
  const poll = setInterval(async () => {
    attach();
    const sig = await signature();
    if (sig !== lastSig) {
      lastSig = sig;
      fire();
    }
  }, POLL_MS);
  poll.unref();
  return () => {
    clearInterval(poll);
    clearTimeout(timer);
    watcher?.close();
  };
}

/** Starts a per-instance HTTP server bound to 127.0.0.1 on an ephemeral port. */
export async function startServer(controller) {
  const clients = new Set();

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://127.0.0.1");
      if (req.method === "GET" && ASSETS[url.pathname]) {
        const [file, type] = ASSETS[url.pathname];
        const body = await fs.readFile(path.join(PUBLIC_DIR, file));
        res.writeHead(200, { "content-type": type, "cache-control": "no-store", "x-content-type-options": "nosniff" });
        return res.end(body);
      }
      if (req.method === "GET" && url.pathname === "/api/state") return sendJson(res, 200, await controller.getState());
      if (req.method === "GET" && url.pathname === "/events") {
        res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store", connection: "keep-alive" });
        res.write(": connected\n\n");
        clients.add(res);
        req.on("close", () => clients.delete(res));
        return;
      }
      if (req.method === "POST" && url.pathname === "/api/view") {
        return sendJson(res, 200, await controller.setView(await readJson(req)));
      }
      sendJson(res, 404, { error: "not-found" });
    } catch (err) {
      sendJson(res, err.status ?? 400, { error: err.code ?? "error", message: err.message });
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const keepAlive = setInterval(() => {
    for (const c of clients) c.write(": ping\n\n");
  }, 25000);
  keepAlive.unref();

  return {
    url: `http://127.0.0.1:${server.address().port}/`,
    broadcast(state) {
      const payload = `event: state\ndata: ${JSON.stringify(state)}\n\n`;
      for (const c of clients) c.write(payload);
    },
    close() {
      clearInterval(keepAlive);
      for (const c of clients) c.end();
      clients.clear();
      return new Promise((resolve) => server.close(() => resolve()));
    },
  };
}
