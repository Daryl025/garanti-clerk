# Garanti Express TMS — Project Summary

## Infrastructure
- Backend: https://sweet-patience-production.up.railway.app
- DB: postgresql://postgres:tOYNdpeRRfZnshGTwUsYRtPxisajzpHN@acela.proxy.rlwy.net:26750/railway
- GitHub backend: https://github.com/Daryl025/garanti-tms-backend
- GitHub passenger: https://github.com/Daryl025/garanti-passenger
- GitHub clerk: https://github.com/Daryl025/garanti-clerk

## Current Commits
- garanti-passenger: edbb905
- garanti-clerk: 37dd5e0
- garanti-tms-backend: b0f998b

## Features Complete
- Passenger app: search, seat selection, booking, QR code, SMS confirmation
- Clerk app: login, QR scanner, walk-in, seat map view, trip picker, offline banner
- Backend: trips, seats, tickets, validate, manifest, HMAC QR, SMS via Twilio
- Offline banner + trip caching on both apps
- Book Another navigation fixed

## SMS Notes
- Twilio credentials hardcoded as fallbacks in src/utils/sms.js
- Works for US numbers (+1) in trial mode
- To enable Cameroon (+237): console.twilio.com -> Messaging -> Geo Permissions -> enable Cameroon

## Hardcoded Trip IDs (June 9 2026)
- GE-101: 501afc2a-91eb-4136-a92d-e96da16242c9 (06:00 DLA->YDE)
- GE-102: d94859c6-c214-4d78-a775-0c0bdc3a9c7b (13:00 DLA->YDE)

## Pending
- Owner portal Netlify deploy
- EAS App Store build + submit
- Fetch today trips dynamically in ClerkHome (currently hardcoded)
- Cameroon SMS geo permissions (Twilio)
- Remove debug sms-test endpoint before production
