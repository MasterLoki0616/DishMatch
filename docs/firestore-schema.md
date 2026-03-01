# Firestore Database Schema (DishMatch MVP)

## Collections Overview

### `sessions` (top-level)

One active dinner session shared by two users.

**Document ID:** `{sessionId}` (auto-generated)

```js
{
  code: "4831",                    // 4-digit join code, unique while active
  status: "waiting" | "active" | "matched" | "closed",
  hostUid: "uid_user_a",
  participants: ["uid_user_a", "uid_user_b"],

  location: {
    lat: 37.7749,
    lng: -122.4194,
    radiusMeters: 5000
  },

  // Restaurant cards shared by both users for deterministic ordering
  restaurants: [
    {
      id: "google_place_id_1",
      name: "Sushi Place",
      rating: 4.6,
      priceLevel: 2,
      imageUrl: "https://...",
      phoneNumber: "+14155551234",
      address: "123 Main St",
      lat: 37.77,
      lng: -122.41
    }
  ],

  // Like map keyed by restaurant ID for quick real-time checks
  likesByRestaurant: {
    "google_place_id_1": ["uid_user_a", "uid_user_b"],
    "google_place_id_2": ["uid_user_a"]
  },

  matchedRestaurantId: "google_place_id_1", // null until match
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

### Optional Subcollection: `sessions/{sessionId}/swipes`

Useful for analytics/debugging/audit trails.

**Document ID:** `{uid}_{restaurantId}`

```js
{
  uid: "uid_user_a",
  restaurantId: "google_place_id_1",
  action: "left" | "right",
  createdAt: Timestamp
}
```

---

### Optional Collection: `matches`

Denormalized match feed for history/re-engagement.

**Document ID:** `{sessionId}` or auto ID

```js
{
  sessionId: "abc123",
  participants: ["uid_user_a", "uid_user_b"],
  restaurant: {
    id: "google_place_id_1",
    name: "Sushi Place",
    address: "123 Main St",
    phoneNumber: "+14155551234",
    lat: 37.77,
    lng: -122.41
  },
  createdAt: Timestamp
}
```

---

## Read/Write Patterns

1. **Create Session:** host writes one `sessions` document with `status=waiting`.
2. **Join Session:** second user updates `participants` and `status=active`.
3. **Swipe Right:** transaction updates `likesByRestaurant.{restaurantId}` with `arrayUnion(uid)`.
4. **Match Detection:** real-time listener or Cloud Function checks if like array contains both UIDs.
5. **Finalize Match:** set `matchedRestaurantId`, `status=matched`, and optionally create `matches` doc.

---

## Recommended Indexes

- `sessions`: composite index on `code (ASC)` + `status (ASC)` for join lookups.
- `matches`: `participants (ARRAY_CONTAINS)` + `createdAt (DESC)` for user history.

---

## Security Rule Intent (High Level)

- Only authenticated users can read/write.
- User can read a session **only if** their UID is in `participants`.
- User can update likes only for their own UID.
- Prevent third participant from joining once `participants.length == 2`.
