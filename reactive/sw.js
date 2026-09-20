
const swPath = self.location.pathname;
const basePath = swPath.substring(0, swPath.lastIndexOf('/') + 1);
self.basePath = self.basePath || basePath;

importScripts("https://cdn.jsdelivr.net/npm/@titaniumnetwork-dev/ultraviolet@1.0.0/dist/uv.sw.js");
importScripts("https://cdn.jsdelivr.net/npm/@mercuryworkshop/bare-mux/dist/index.js");

const ultraviolet = new UVServiceWorker();

self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
    event.respondWith((async () => {
        if (ultraviolet.route(event)) {
            return ultraviolet.fetch(event);
        }
        return fetch(event.request);
    })());
});

let wispConfig = {};
let resolveConfigReady;
const configReadyPromise = new Promise(resolve => resolveConfigReady = resolve);

self.addEventListener("message", ({ data }) => {
    if (data.type === "config" && data.wispurl) {
        wispConfig.wispurl = data.wispurl;
        console.log("SW: Received config", wispConfig);
        if (resolveConfigReady) {
            resolveConfigReady();
            resolveConfigReady = null;
        }
    }
});

// Fallback if config is never received (prevents 500 error)
setTimeout(() => {
    if (!wispConfig.wispurl && resolveConfigReady) {
        console.warn("SW: Config timeout, using anura's Wisp");
        wispConfig.wispurl = "wss://anura.pro/";
        resolveConfigReady();
        resolveConfigReady = null;
    }
}, 1000);

ultraviolet.addEventListener("request", async (e) => {
    e.response = (async () => {
        if (!ultraviolet.client) {
            await configReadyPromise;
            if (!wispConfig.wispurl) return new Response("WISP URL missing", { status: 500 });

            const connection = new BareMux.BareMuxConnection(basePath + "bareworker.js");
            await connection.setTransport("https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-transport@2.1.28/dist/index.mjs", [{ wisp: wispConfig.wispurl }]);
            ultraviolet.client = connection;
        }
        const MAX_RETRIES = 2;
        let lastErr;

        for (let i = 0; i <= MAX_RETRIES; i++) {
            try {
                return await ultraviolet.client.fetch(e.url, {
                    method: e.method,
                    body: e.body,
                    headers: e.requestHeaders,
                    credentials: "include",
                    mode: e.mode === "cors" ? e.mode : "same-origin",
                    cache: e.cache,
                    redirect: "manual",
                    duplex: "half",
                });
            } catch (err) {
                lastErr = err;
                const errMsg = err.message.toLowerCase();
                const isRetryable = errMsg.includes("connect") ||
                    errMsg.includes("eof") ||
                    errMsg.includes("handshake") ||
                    errMsg.includes("reset");

                if (!isRetryable || i === MAX_RETRIES || e.method !== 'GET') break;

                console.warn(`Ultraviolet retry ${i + 1}/${MAX_RETRIES} for ${e.url} due to: ${err.message}`);
                await new Promise(r => setTimeout(r, 500 * (i + 1)));
            }
        }

        console.error("Ultraviolet Final Fetch Error:", lastErr);
        return new Response("Ultraviolet Fetch Error: " + lastErr.message, { status: 502 });
    })();
});
