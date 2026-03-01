# DishMatch

Tinder-style restaurant swiping MVP (Expo + React Native + Firebase).

## Current status

This repository now includes:

- MVP swipe UI in `App.js`
- Firestore schema docs in `docs/firestore-schema.md`
- Project roadmap in `docs/technical-roadmap.md`

## 1) Prerequisites

- Node.js 18+
- npm 9+
- Expo Go app on your phone (optional, easiest way to test)
- Firebase project (Auth + Firestore enabled)
- Google Places API key

## 2) Install dependencies

```bash
npm install
```

## 3) Configure environment variables

Create a `.env` file in the repo root:

```bash
cp .env.example .env
```

Fill in all values:

- `EXPO_PUBLIC_FIREBASE_*`
- `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY`

## 4) Set a real session ID

In `App.js`, replace:

```js
const [sessionId] = useState("REPLACE_WITH_SESSION_ID");
```

with a valid Firestore session document ID.

> Quick test path: manually create a `sessions/{sessionId}` document matching `docs/firestore-schema.md`.

## 5) Run the app

Start Expo:

```bash
npm run start
```

Then choose one:

- Press `a` for Android emulator
- Press `i` for iOS simulator (macOS only)
- Scan QR code with Expo Go on a phone

## Note about branch update tools

Some hosted branch editors/tools reject commits that contain binary files (for example PNG assets) and show **"Binary files are not supported"**. This repo is configured to run without committed binary assets by default. If you want custom app icons/splash screens, add image files later and point `app.json` to them in your own branch/tooling.

## Common issues

- **Blank cards / no restaurants:** check location permissions and Google Places key restrictions.
- **No matches appearing:** ensure both users are writing likes to the same `sessions/{sessionId}` document and both UIDs are in `participants`.
- **Firebase auth null UID:** make sure you implement an auth bootstrap (e.g., anonymous sign-in) before swiping.

## Next required wiring

For a fully runnable flow, add:

1. Session create/join screen to generate & enter a 4-digit code.
2. Anonymous auth bootstrap on app launch.
3. Persist fetched restaurants to `sessions.restaurants` so both users swipe the same list.
