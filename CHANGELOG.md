# Changelog

## [0.5.0] - 2026-03-20

### Added
- Express.js backend with multi-tenant SQLite database
- kwtsms API client (balance, senderid, coverage, send, validate)
- SMS send flow with all gates (master switch, credentials, event toggle, balance, coverage, dedup)
- Phone normalization, verification, deduplication services
- Message cleaning (emoji, hidden chars) and template rendering
- AES-256-GCM credential encryption at rest
- Auto-provisioned Zendesk triggers via trigger manager
- Zendesk OAuth flow for Marketplace install
- Daily cron sync (balance, SenderIDs, coverage) with 90-day log purge
- ZAF React app with Zendesk Garden components
- Dashboard with balance, stats, event toggles
- Settings with kwtsms login/logout, SenderID selection
- Customizable SMS templates with placeholders (English + Arabic)
- SMS logs with filtering, pagination, clear
- Input sanitization, rate limiting, webhook signature verification
- PM2 production config
