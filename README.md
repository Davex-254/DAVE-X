# DAVE-X

A multi-platform launcher for the **DAVE-X WhatsApp Bot** — built for straightforward deployment and always-on operation.

<p align="center">
  <a href="https://github.com/Davex-254/DAVE-X">
    <img src="https://img.shields.io/badge/GitHub-Davex--254%2FDAVE--X-181717?style=for-the-badge&logo=github" alt="GitHub">
  </a>
  <a href="https://github.com/Davex-254/DAVE-X/archive/refs/heads/main.zip">
    <img src="https://img.shields.io/badge/Download-ZIP-2ea44f?style=for-the-badge&logo=github" alt="Download ZIP">
  </a>
</p>

---

## 🌐 Session Servers

<table>
<tr>
<td align="center" width="50%">
  <b>Server 1 — Dave Tech</b><br>
  <sub>Primary session service</sub><br><br>
  <a href="https://davextechwebservice.zone.id/main">
    <img src="https://img.shields.io/badge/Open_Server_1-6f42c1?style=for-the-badge&logo=whatsapp&logoColor=white" alt="Open Server 1">
  </a>
</td>
<td align="center" width="50%">
  <b>Server 2 — Render</b><br>
  <sub>Backup session service</sub><br><br>
  <a href="https://session-incr.onrender.com/">
    <img src="https://img.shields.io/badge/Open_Server_2-6f42c1?style=for-the-badge&logo=whatsapp&logoColor=white" alt="Open Server 2">
  </a>
</td>
</tr>
</table>

---

## 🚀 One-Click Deploy

| Platform | Deploy |
|---|---|
| **Heroku** | [Deploy to Heroku](https://www.heroku.com/deploy?template=https%3A%2F%2Fgithub.com%2FDavex-254%2FDAVE-X%2Ftree%2Fmain) |
| **Render** | [Deploy on Render](https://render.com/deploy?repo=https://github.com/Davex-254/DAVE-X) |
| **Railway** | [Deploy on Railway](https://railway.app/new/template?template=https://github.com/Davex-254/DAVE-X) |
| **Koyeb** | [Deploy on Koyeb](https://app.koyeb.com/deploy?type=git&repository=github.com/Davex-254/DAVE-X) |
| **Replit** | [Open in Replit](https://replit.com/github/Davex-254/DAVE-X) |

---

## ⚙️ Setup

**Required environment variable:**

| Variable | Required | Description |
|---|---:|---|
| `SESSION_ID` | ✅ Yes | Your DAVE-X session credential. Must begin with `DAVE-X:~`. |

For local hosting, place it in a `.env` file at the project root. **Never commit credentials** to GitHub or share them in a ZIP.

---

## 💻 Local Run

```bash
git clone https://github.com/Davex-254/DAVE-X.git
cd DAVE-X
npm install --legacy-peer-deps
npm start