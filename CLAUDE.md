# Garanti Express TMS — Project Summary

## Infrastructure
- Backend: https://sweet-patience-production.up.railway.app
- DB: postgresql://postgres:tOYNdpeRRfZnshGTwUsYRtPxisajzpHN@acela.proxy.rlwy.net:26750/railway
- GitHub backend: https://github.com/Daryl025/garanti-tms-backend
- GitHub passenger: https://github.com/Daryl025/garanti-passenger
- GitHub clerk: https://github.com/Daryl025/garanti-clerk

## Current Commits
- garanti-passenger: 7e384bc
- garanti-clerk: 652a843
- garanti-tms-backend: 13006a6

## Features Complete
- Passenger app: search, seat selection, booking, QR code, SMS confirmation
- Clerk app: login, QR scanner, walk-in, seat map view with passenger info, trip picker
- Backend: trips, seats, tickets, validate, manifest endpoint, HMAC QR security
- Offline banner, trip caching, timeouts on all API calls
- .env secured, not tracked in git

## Hardcoded Trip IDs (today's trips)
- GE-101: 501afc2a-91eb-4136-a92d-e96da16242c9 (06:00 DLA->YDE)
- GE-102: d94859c6-c214-4d78-a775-0c0bdc3a9c7b (13:00 DLA->YDE)

## Pending
- Owner portal Netlify deploy
- EAS App Store build + submit
- Fetch today's trips dynamically in ClerkHome (currently hardcoded)
- Remove debug Alert in PassengerDetails
