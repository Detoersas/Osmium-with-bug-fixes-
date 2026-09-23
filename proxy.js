(() => {
  const form = document.getElementById("proxy-form");
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/uv/uv.sw.js", { scope: "/service/" });
  const input = document.getElementById("proxy-url");
  const error = document.getElementById("proxy-error");
  if (!form || !input || !error) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    error.hidden = true;
    let url;
    try { url = new URL(input.value.trim()); } catch { error.textContent = "Enter a complete website address, such as https://example.com."; error.hidden = false; return; }
    if (!/^https?:$/.test(url.protocol)) { error.textContent = "Only http and https websites are supported."; error.hidden = false; return; }
    if (!window.__uv$config || typeof BareClient === "undefined") { error.textContent = "Ultraviolet is still loading. Refresh and try again."; error.hidden = false; return; }
    location.href = __uv$config.prefix + __uv$config.encodeUrl(url.href);
  });
})();
