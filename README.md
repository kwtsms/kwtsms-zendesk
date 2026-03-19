# kwtsms Zendesk Integration

SMS notifications for Zendesk ticket events via the kwtsms gateway.

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

## Setup

1. `npm install` (installs both workspaces)
2. Copy `.env.example` to `.env` and fill in values
3. `npm run dev:server` to start backend
4. `npm run dev:app` to start ZAF app dev server

## License

MIT
