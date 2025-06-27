
# Ascenda Lift Thailand LINE Bot v3

**What's new**
- Exits early with clear error if `CHANNEL_ACCESS_TOKEN` or `CHANNEL_SECRET` are missing.
- Logs first 10 characters of the access token on startup, so you know env vars are loaded.
- All previous features retained (Thai/EN, working-hours hand‑off, installation escalation, GPT‑4o fallback).

## Quick Deploy on Railway

1. Fork / upload this repo.
2. Add project variables:
   - `CHANNEL_ACCESS_TOKEN`
   - `CHANNEL_SECRET`
   - `OPENAI_API_KEY`
   - `PORT=3000`
3. Hit **Restart**.
4. Set webhook URL to `https://<railway-domain>/webhook` in LINE Manager → Messaging API.
