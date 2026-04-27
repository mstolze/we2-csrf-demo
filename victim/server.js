const express = require('express');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

let email = 'alice@example.com';
let secureMode = false;
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

function requireSession(req, res, next) {
  if (req.cookies.session !== 'alice-session') {
    return res.status(401).send(`
      <h1>401 Unauthorized</h1>
      <p>No valid session cookie.</p>
      <p>Email was NOT changed.</p>
      <p>Received session cookie: <b>${req.cookies.session || 'none'}</b></p>
      <p><a href="/">Back</a></p>
    `);
  }

  next();
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

    <h2>Debug Info</h2>
    <p>Received session cookie: <b>${req.cookies.session || 'none'}</b></p>
    <p>Server cookie mode: <b>SameSite=${cookieMode}</b></p>

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
  `);
});

app.get('/settings-post', (req, res) => {
  setDemoCookie(res);

  res.send(`
    <h1>Settings: Change Email via POST</h1>

    <p>Received session cookie: <b>${req.cookies.session || 'none'}</b></p>

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

app.post('/toggle-csrf', requireSession, (req, res) => {
  secureMode = !secureMode;
  session.csrfToken = crypto.randomBytes(16).toString('hex');
  setDemoCookie(res);
  res.redirect('/');
});

// Wichtig für Demo: nicht mit requireSession schützen
app.post('/toggle-cookie', (req, res) => {
  cookieMode = cookieMode === 'lax' ? 'none' : 'lax';
  setDemoCookie(res);
  res.redirect('/');
});

app.post('/change-email', requireSession, (req, res) => {
  setDemoCookie(res);

  if (secureMode && req.body.csrfToken !== session.csrfToken) {
    return res.status(403).send(`
      <h1>403 Forbidden</h1>
      <p>Invalid or missing CSRF token.</p>
      <p>Email was NOT changed.</p>
      <p>Received session cookie: <b>${req.cookies.session || 'none'}</b></p>
      <p><a href="/">Back</a></p>
    `);
  }

  email = req.body.email || email;

  res.send(`
    <h1>Email changed via POST</h1>
    <p>New email: <b>${email}</b></p>
    <p>Received session cookie: <b>${req.cookies.session || 'none'}</b></p>
    <p><a href="/">Back</a></p>
  `);
});

app.get('/change-email-get', requireSession, (req, res) => {
  setDemoCookie(res);

  email = req.query.email || email;

  res.send(`
    <h1>Email changed via GET</h1>
    <p>New email: <b>${email}</b></p>
    <p>Received session cookie: <b>${req.cookies.session || 'none'}</b></p>
    <p><a href="/">Back</a></p>
  `);
});

app.listen(port, () => {
  console.log(`Victim app running on port ${port}`);
});