# DAVE-X

A reliable multi-platform launcher for the **DAVE-X WhatsApp Bot**, built for straightforward deployment and unattended operation.

<p align="center">
  <a href="https://github.com/Davex-254/DAVE-X">
    <img src="https://img.shields.io/badge/GitHub-Davex--254%2FDAVE--X-181717?style=for-the-badge&logo=github" alt="GitHub repository">
  </a>
  <a href="https://github.com/Davex-254/DAVE-X/archive/refs/heads/main.zip">
    <img src="https://img.shields.io/badge/Download-Source_ZIP-2ea44f?style=for-the-badge&logo=github" alt="Download source ZIP">
  </a>
  <a href="https://session-incr.onrender.com/">
    <img src="https://img.shields.io/badge/Session-Get_ID-6f42c1?style=for-the-badge&logo=whatsapp" alt="Get session ID">
  </a>
</p>

## Overview

DAVE-X provides a stable launcher workflow for hosting the bot on supported Node.js platforms. It handles startup, environment configuration, connection recovery, release updates, and graceful restarts while keeping the operator experience simple.

The launcher is designed for **Node.js 20.19 or newer** and uses SQLite for local bot persistence. It does not require PostgreSQL for standard deployments.

## One-click deployment

| Platform | Deploy |
|---|---|
| Heroku | [Deploy to Heroku](https://heroku.com/deploy?template=https://github.com/Davex-254/DAVE-X) |
| Replit | [Open in Replit](https://replit.com/github/Davex-254/DAVE-X) |
| Koyeb | [Deploy on Koyeb](https://app.koyeb.com/deploy?type=git&repository=github.com/Davex-254/DAVE-X) |
| Railway | [Deploy on Railway](https://railway.app/new/template?template=https://github.com/Davex-254/DAVE-X) |
| Render | [Deploy on Render](https://render.com/deploy?repo=https://github.com/Davex-254/DAVE-X) |

> **Repository:** [github.com/Davex-254/DAVE-X](https://github.com/Davex-254/DAVE-X)

## Required configuration

Set the following environment variable in your hosting provider before starting the service:

| Variable | Required | Description |
|---|---:|---|
| `SESSION_ID` | Yes | Your DAVE-X session credential. It must begin with `DAVE-X:~`. |

For local hosting, place the value in a `.env` file in the project directory. Do not commit credentials to GitHub or include them in a ZIP shared with other users.

## Local installation

```bash
git clone https://github.com/Davex-254/DAVE-X.git
cd DAVE-X
npm install --legacy-peer-deps
npm start
```

The launcher also provides alternative start profiles for hosts with different memory limits:

```bash
npm run start:low
npm run start:mid
npm run start:high
```

Use `npm run dev` only when actively diagnosing a deployment. Production deployments should use `npm start` or the platform’s standard start command.

## Session setup

1. Open the [DAVE-X session service](https://session-incr.onrender.com/).
2. Generate or retrieve your session credential.
3. Add it to the host as `SESSION_ID`.
4. Start or redeploy the service.
5. Confirm that the application health page responds on the port supplied by the hosting platform.

When a new session credential is intentionally supplied, the launcher replaces the previous connection state before reconnecting.

## Deployment notes

The included deployment files provide platform-specific defaults for Heroku, Render, Railway, Koyeb, Fly.io, and Replit. If your provider exposes a `PORT` variable, the launcher uses the platform-assigned value automatically.

For reliable operation, use a persistent service or worker instead of a short-lived request-only function. The bot needs an always-on Node.js process to maintain its WhatsApp connection.

## Troubleshooting

| Symptom | Recommended action |
|---|---|
| The service starts but does not connect | Confirm that `SESSION_ID` is present, valid, and begins with `DAVE-X:~`. |
| The deployment cannot find the repository | Verify that the deployment template uses [Davex-254/DAVE-X](https://github.com/Davex-254/DAVE-X) and that the repository URL has no old owner name. |
| The process repeatedly restarts | Check the host logs for the first error, confirm Node.js 20.19+, and verify that the host has enough memory. |
| The service is online but the health page is unavailable | Ensure the process listens on the platform-provided `PORT` and that the host is not using a conflicting fixed port. |
| A session must be replaced | Update `SESSION_ID` and restart the service so the new credential is loaded cleanly. |

## Support and updates

Use the repository for the latest launcher source, deployment definitions, and release updates:

- [GitHub repository](https://github.com/Davex-254/DAVE-X)
- [Download the latest ZIP](https://github.com/Davex-254/DAVE-X/archive/refs/heads/main.zip)
- [DAVE-X session service](https://session-incr.onrender.com/)

## License

© 2026 Dave Tech. All rights reserved.
