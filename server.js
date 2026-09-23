import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createBareServer } from "@tomphttp/bare-server-node";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const bareServer = createBareServer("/bare/");
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".ico": "image/x-icon", ".svg": "image/svg+xml" };

function serveFile(req, res) {
  const requestPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  if (requestPath === "/uv.config.js" || requestPath === "/uv/uv.config.js") {
    return fs.readFile(path.join(root, "uv.config.js"), (error, data) => {
      if (error) { res.writeHead(404); res.end("Not found"); return; }
      res.writeHead(200, { "Content-Type": "text/javascript", "Cache-Control": "no-store" });
      res.end(data);
    });
  }
  if (requestPath.startsWith("/uv/")) {
    const assetPath = path.resolve(uvPath, requestPath.slice("/uv/".length));
    if (!assetPath.startsWith(`${path.resolve(uvPath)}${path.sep}`)) {
      res.writeHead(403); res.end("Forbidden"); return;
    }
    return fs.readFile(assetPath, (error, data) => {
      if (error) { res.writeHead(404); res.end("Not found"); return; }
      res.writeHead(200, { "Content-Type": mime[path.extname(assetPath)] || "application/javascript", "Cache-Control": "no-store" });
      res.end(data);
    });
  }
  const relative = requestPath === "/" ? "/index.html" : requestPath;
  const safePath = path.normalize(relative).replace(/^([.][.][/\\])+/, "");
  const filePath = safePath.startsWith("/uv/")
    ? path.join(uvPath, safePath.slice(4))
    : path.join(root, safePath);
  if (!filePath.startsWith(root) && !filePath.startsWith(uvPath)) {
    res.writeHead(403); res.end("Forbidden"); return;
  }
  fs.readFile(filePath, (error, data) => {
    if (error) { res.writeHead(404); res.end("Not found"); return; }
    res.writeHead(200, { "Content-Type": mime[path.extname(filePath)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (bareServer.shouldRoute(req)) return bareServer.routeRequest(req, res);
  if (req.url?.startsWith("/bare/")) return res.end();
  return serveFile(req, res);
});
server.on("upgrade", (req, socket, head) => {
  if (bareServer.shouldRoute(req)) bareServer.routeUpgrade(req, socket, head);
  else socket.end();
});
server.listen(port, () => console.log(`Osmium server listening on http://localhost:${port}`));
process.on("SIGINT", () => { bareServer.close(); server.close(() => process.exit(0)); });
process.on("SIGTERM", () => { bareServer.close(); server.close(() => process.exit(0)); });

export { server };

/* UV client configuration is served from /uv/uv.config.js and uses /bare/. */
