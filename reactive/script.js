document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <main class="construction-page" role="main" aria-labelledby="construction-title">
      <div class="construction-card">
        <div class="construction-stripes" aria-hidden="true"></div>
        <div class="construction-icon" aria-hidden="true"><i class="fa-solid fa-person-digging"></i></div>
        <p class="construction-kicker">Under construction</p>
        <h1 id="construction-title">Proxy services are temporarily unavailable</h1>
        <p>Proxy features are being rebuilt and cannot be opened right now. Please check back when maintenance is complete.</p>
        <button class="construction-button" type="button" onclick="history.back()">Return</button>
      </div>
    </main>`;
});
