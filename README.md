# kwtsms Zendesk Integration

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Zendesk](https://img.shields.io/badge/Zendesk-Marketplace-03363D?logo=zendesk&logoColor=white)](https://www.zendesk.com/marketplace/)
[![kwtsms](https://img.shields.io/badge/kwtsms-SMS%20Gateway-FFA200)](https://www.kwtsms.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

SMS notifications for Zendesk ticket events via the kwtsms gateway.

All kwtSMS integrations: [kwtsms.com/integrations](https://www.kwtsms.com/integrations/)

## Features

- Automatic SMS on ticket events (new, status change, agent reply, assignment)
- Customizable message templates with placeholders (English + Arabic)
- Per-event toggle controls
- SMS delivery logs with filtering
- Multi-tenant: serves multiple Zendesk accounts
- Auto-provisioned Zendesk triggers

## Structure

- `server/` - Express.js backend (webhook processing, REST API, SMS sending)
- `app/` - ZAF React app (admin UI inside Zendesk)

## Development Setup

1. `npm install` (installs both workspaces)
2. Copy `.env.example` to `server/.env` and fill in values
3. `npm run dev:server` to start backend
4. `npm run dev:app` to start ZAF app dev server
5. Install ZCLI: `npm install -g @zendesk/zcli`
6. Run ZAF locally: `cd app && npx @zendesk/zcli apps:server dist`

## Production Deployment

### Backend (Express.js)

```bash
# On your cPanel server with PM2 + Cloudflare tunnel
cd server
cp ../.env.example .env   # Fill in production values
pm2 start ecosystem.config.js
pm2 save

# Cloudflare tunnel (already configured)
cloudflared tunnel --url http://localhost:3000
```

### ZAF App (Zendesk Marketplace)

```bash
# Build and package
npm run build:app
cd app
npx @zendesk/zcli apps:validate dist
npx @zendesk/zcli apps:package dist

# Upload the .zip from app/tmp/ to Zendesk Marketplace
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `ENCRYPTION_KEY` | 64-char hex string for AES-256 encryption |
| `ZENDESK_CLIENT_ID` | OAuth client ID from Zendesk |
| `ZENDESK_CLIENT_SECRET` | OAuth client secret |
| `ZENDESK_REDIRECT_URI` | OAuth callback URL |
| `WEBHOOK_BASE_URL` | Public URL of your backend |
| `WEBHOOK_SIGNING_SECRET` | Secret for webhook signature verification |
| `TEST_PHONE` | Phone number for testing |
| `DB_PATH` | SQLite database file path |

## Testing

All tests hit the real kwtsms API with `test=1` (no mocks):

```bash
cd server
KWTSMS_TEST_USER=your_user KWTSMS_TEST_PASS=your_pass node --test tests/*.test.js
```

## License

MIT
