(() => {
  const form = document.getElementById("proxy-form");
  const serviceWorkerReady = "serviceWorker" in navigator
    ? navigator.serviceWorker.register("/uv/uv.sw.js", { scope: "/" }).then(async (registration) => {
        await navigator.serviceWorker.ready;
        if (!navigator.serviceWorker.controller && !sessionStorage.getItem("osmium-uv-ready")) {
          sessionStorage.setItem("osmium-uv-ready", "1");
          location.reload();
        }
        return registration;
      })
    : Promise.reject(new Error("Service workers are not supported"));
  const input = document.getElementById("proxy-url");
  const error = document.getElementById("proxy-error");
  if (!form || !input || !error) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    error.hidden = true;

    const value = input.value.trim();
    if (!value) {
      error.textContent = "Enter a website address, such as google.com.";
      error.hidden = false;
      return;
    }

    const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`;
    let url;
    try { url = new URL(candidate); } catch {
      error.textContent = "Enter a valid website address, such as google.com.";
      error.hidden = false;
      return;
    }
    if (!/^https?:$/.test(url.protocol) || !url.hostname) {
      error.textContent = "Only http and https websites are supported.";
      error.hidden = false;
      return;
    }
    if (!window.__uv$config || typeof window.__uv$config.encodeUrl !== "function") {
      error.textContent = "Ultraviolet is still loading. Refresh and try again.";
      error.hidden = false;
      return;
    }
    try {
      await serviceWorkerReady;
      location.href = window.__uv$config.prefix + window.__uv$config.encodeUrl(url.href);
    } catch {
      error.textContent = "Ultraviolet could not start. Refresh and try again.";
      error.hidden = false;
    }
  });
})();
