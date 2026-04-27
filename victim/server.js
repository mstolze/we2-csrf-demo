const express = require('express');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));

let email = 'alice@example.com';
let secureMode = false; // false = no CSRF token, true = CSRF token required
let cookieMode = 'lax'; // 'lax' or 'none'

const session = {
  userId: 1,
  userName: 'Alice',
  csrfToken: crypto.randomBytes(16).toString('hex')
};

function setDemoCookie(res) {
  res.cookie('session', 'alice-session', {
    httpOnly: true,
    secure: true,
    sameSite: cookieMode
  });
}

function modeColor(value) {
  return value ? 'green' : 'red';
}

app.get('/', (req, res) => {
  setDemoCookie(res);

  res.send(`
    <h1>Victim App</h1>

    <p>👤 Logged in as: <b>${session.userName}</b></p>
    <p>Email: <b>${email}</b></p>

    <hr>

    <h2>Security Settings</h2>

    <p>
      CSRF protection:
      <b style="color:${modeColor(secureMode)}">
        ${secureMode ? 'ON — CSRF token required' : 'OFF — no CSRF token'}
      </b>
    </p>

    <form method="POST" action="/toggle-csrf">
      <button type="submit">
        Switch CSRF protection ${secureMode ? 'OFF' : 'ON'}
      </button>
    </form>

    <p>
      Cookie SameSite:
      <b>${cookieMode.toUpperCase()}</b>
    </p>

    <form method="POST" action="/toggle-cookie">
      <button type="submit">
        Switch Cookie to SameSite=${cookieMode === 'lax' ? 'None' : 'Lax'}
      </button>
    </form>

    <hr>

    <h2>Legitimate Actions</h2>

    <ul>
      <li><a href="/settings-post">Change Email via POST form</a></li>
      <li><a href="/settings-get">Change Email via GET form (bad design)</a></li>
    </ul>

    <hr>

    <h2>Demo Notes</h2>
    <ul>
      <li><b>POST + SameSite=None</b>: attack can work if no CSRF token is required.</li>
      <li><b>POST + SameSite=Lax</b>: modern browsers often block cookie sending.</li>
      <li><b>GET + SameSite=Lax</b>: can still work as top-level navigation.</li>
      <li><b>CSRF token ON</b>: POST attack fails because attacker cannot provide the token.</li>
    </ul>
  `);
});

app.get('/settings-post', (req, res) => {
  setDemoCookie(res);

  res.send(`
    <h1>Settings: Change Email via POST</h1>

    <p>CSRF protection:
      <b style="color:${modeColor(secureMode)}">${secureMode ? 'ON' : 'OFF'}</b>
    </p>

    <form method="POST" action="/change-email">
      <label>
        New email:
        <input name="email" value="${email}" />
      </label>

      ${
        secureMode
          ? `<input type="hidden" name="csrfToken" value="${session.csrfToken}" />`
          : ''
      }

      <button type="submit">Save</button>
    </form>

    <p><a href="/">Back</a></p>
  `);
});

app.get('/settings-get', (req, res) => {
  setDemoCookie(res);

  res.send(`
    <h1>Settings: Change Email via GET</h1>

    <p><b>Bad design:</b> GET should not change server state.</p>

    <form method="GET" action="/change-email-get">
      <label>
        New email:
        <input name="email" value="${email}" />
      </label>
      <button type="submit">Save via GET</button>
    </form>

    <p><a href="/">Back</a></p>
  `);
});

app.post('/toggle-csrf', (req, res) => {
  secureMode = !secureMode;
  session.csrfToken = crypto.randomBytes(16).toString('hex');
  res.redirect('/');
});

app.post('/toggle-cookie', (req, res) => {
  cookieMode = cookieMode === 'lax' ? 'none' : 'lax';
  res.redirect('/');
});

app.post('/change-email', (req, res) => {
  setDemoCookie(res);

  if (secureMode && req.body.csrfToken !== session.csrfToken) {
    return res.status(403).send(`
      <h1>403 Forbidden</h1>
      <p>Invalid or missing CSRF token.</p>
      <p>Email was NOT changed.</p>
      <p><a href="/">Back</a></p>
    `);
  }

  email = req.body.email || email;

  res.send(`
    <h1>Email changed via POST</h1>
    <p>New email: <b>${email}</b></p>
    <p><a href="/">Back</a></p>
  `);
});

// Intentionally vulnerable GET endpoint
app.get('/change-email-get', (req, res) => {
  setDemoCookie(res);

  email = req.query.email || email;

  res.send(`
    <h1>Email changed via GET</h1>
    <p>New email: <b>${email}</b></p>
    <p><a href="/">Back</a></p>
  `);
});

app.listen(port, () => {
  console.log(`Victim app running on port ${port}`);
});