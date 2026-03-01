# DishMatch MVP Technical Roadmap

## 1) Recommended MVP Stack

- **Frontend:** React Native with **Expo** (fast iteration, cross-platform iOS/Android)
- **Backend:** Firebase
  - Firebase Authentication (anonymous + optional phone/email upgrade)
  - Cloud Firestore (sessions, swipes, matches)
  - Cloud Functions (optional server-side match validation + notifications)
- **External API:** Google Places API (Nearby Search + Place Details + Photo)
- **Maps/Navigation:** `react-native-maps`, native map links for directions

---

## 2) Step-by-Step Project Structure (MVP)

```txt
DishMatch/
├─ App.js                        # Main entry + navigation container
├─ app.json
├─ package.json
├─ docs/
│  ├─ technical-roadmap.md       # This roadmap
│  └─ firestore-schema.md        # Data model details
├─ firebase/
│  ├─ firestore.rules            # Security rules
│  └─ indexes.json               # Firestore composite indexes if needed
└─ src/
   ├─ components/
   │  ├─ SwipeCard.js            # Single card UI: image/name/rating/price
   │  └─ MatchOverlay.js         # "It's a Match" overlay modal
   ├─ screens/
   │  ├─ HomeScreen.js           # Start/join session UI
   │  ├─ SwipeScreen.js          # Main swipe stack + listener
   │  └─ MatchScreen.js          # Post-match map + actions
   ├─ services/
   │  ├─ firebase.js             # Firebase init/auth/firestore exports
   │  ├─ sessionService.js       # Create/join session and write swipes
   │  └─ placesService.js        # Nearby restaurants via Places API
   ├─ hooks/
   │  ├─ useSession.js           # Session listener hook
   │  └─ useLocation.js          # Expo Location wrapper
   └─ utils/
      ├─ codeGenerator.js        # 4-digit join code logic
      └─ mapLinks.js             # Open maps/call actions
```

---

## 3) Implementation Roadmap (Milestone Based)

### Milestone 0 — Project Bootstrap

1. Create Expo app (`npx create-expo-app DishMatch`).
2. Install dependencies:
   - Firebase SDK
   - React Navigation
   - Expo Location
   - Gesture/swipe library (`react-native-deck-swiper` or custom PanResponder)
   - React Native Maps
3. Configure `.env` for Firebase + Places API keys.

### Milestone 1 — Auth + Session Lifecycle

1. Implement anonymous sign-in on first launch.
2. Build **Create Session** flow:
   - Generate unique 4-digit code.
   - Create Firestore session document with host user.
3. Build **Join Session** flow:
   - Lookup by code.
   - Add second user ID to participants.
4. Lock session when two participants exist.

### Milestone 2 — Location + Restaurant Feed

1. Ask location permission.
2. Fetch GPS coordinates.
3. Request nearby restaurants in 5km radius from Places API.
4. Normalize response into app card model.

### Milestone 3 — Swiping + Real-time Match Engine

1. Render swipe cards with image/name/rating/price.
2. On swipe right:
   - Write user UID into restaurant like map for the session.
3. Real-time `onSnapshot` listener checks if both participants liked same restaurant.
4. Trigger “It’s a Match!” overlay and store match metadata.

### Milestone 4 — Post-Match Experience

1. Create `MatchScreen` with:
   - Restaurant details
   - Map marker
   - Buttons: Call + Directions
2. Add “End Session” and “Start New Session” actions.

### Milestone 5 — Hardening + Launch Prep

1. Firestore security rules for session members only.
2. Cloud Function for trusted match confirmation (optional but recommended).
3. Crash/error monitoring (Sentry).
4. Basic analytics events for conversion funnel.

---

## 4) Initial Feature Acceptance Criteria

- User can create or join a session via 4-digit code.
- Two users can swipe through the same shared restaurant list.
- Match appears in real time when both swipe right on same restaurant.
- Post-match screen can open map directions and call restaurant.

---

## 5) Suggested Timeline (MVP)

- Week 1: Bootstrap + Auth + Session create/join
- Week 2: Location + Places API integration + card deck
- Week 3: Match engine + post-match map/actions
- Week 4: Security rules + bug fixes + test flight/internal QA
