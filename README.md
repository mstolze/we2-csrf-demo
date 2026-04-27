# WE2 CSRF Demo

This repository contains a demo for Cross-Site Request Forgery (CSRF).

It consists of two applications:

- **victim** → vulnerable web application
- **attacker** → malicious website triggering CSRF attacks

---

# 🧠 Learning Goals

- Understand how CSRF works
- See how browsers automatically send cookies
- Learn why SameSite helps but is not sufficient
- Understand why CSRF tokens are necessary
- Recognize bad API design (GET changing state)

---

# 🏗️ Project Structure

we2-csrf-demo/
├── victim/
├── attacker/

---

# 🚀 Deployment (Render)

Create **two services** from this repo:

## 1. Victim App

- Root Directory: `victim`
- Build Command:
  npm install
- Start Command:
  npm start

---

## 2. Attacker App

- Root Directory: `attacker`
- Build Command:
  npm install
- Start Command:
  npm start

---

# 🎯 Demo Flow

## Step 1 — Open Victim App

- User is logged in as **Alice**
- Note the current email

---

## Step 2 — Configure Security

In Victim App:

### Toggle CSRF Protection
- OFF → vulnerable
- ON → protected via token

### Toggle Cookie Mode
- `SameSite=None` → cookies always sent
- `SameSite=Lax` → modern browser default

---

## Step 3 — Open Attacker App

Enter Victim URL:

https://your-victim.onrender.com

---

## Step 4 — Run Attacks

### POST Attack
- targets `/change-email`

### GET Attack
- targets `/change-email-get`

---

# 🔬 Expected Results

| Cookie | CSRF Token | Attack | Result |
|--------|-----------|--------|--------|
| None | OFF | POST | ✅ works |
| None | ON | POST | ❌ blocked |
| Lax | OFF | POST | ❌ often blocked |
| Lax | OFF | GET | ✅ works |

---

# 💡 Key Insights

## 1. Browser Behavior

- Browser automatically sends cookies
- Even for cross-site requests

---

## 2. SameSite

- Reduces CSRF risk
- But does NOT fully prevent it

---

## 3. CSRF Token

- Ensures request comes from legitimate UI
- Prevents attacker from forging requests

---

## 4. Bad API Design

GET /change-email-get

❗ Changing state via GET is insecure

---

# 🎯 Core Takeaway

Cookies prove *who you are*  
CSRF tokens prove *where the request comes from*

---

# ⚠️ Demo Note

This demo intentionally sets:

SameSite=None

to make CSRF attacks visible.

Modern browsers are safer by default, but:

**Security must be enforced on the server, not only by the browser**

---

# 👨‍🏫 Teaching Tip

Run the demo in this order:

1. POST attack works (insecure mode)
2. Enable CSRF → attack fails
3. Switch to SameSite=Lax
4. Show GET attack still works

---

# 🧪 Local Development

Run apps locally:

cd victim
npm install
npm start

cd attacker
npm install
npm start

---

# 📌 Summary

- CSRF exploits trust in browser sessions
- SameSite helps but is not enough
- CSRF tokens are the proper defense
- GET must never change state
