const GOOGLE_PLACES_BASE_URL =
  "https://maps.googleapis.com/maps/api/place/nearbysearch/json";

export async function fetchNearbyRestaurants({
  lat,
  lng,
  radiusMeters = 5000,
}) {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
  const query = new URLSearchParams({
    location: `${lat},${lng}`,
    radius: String(radiusMeters),
    type: "restaurant",
    key: apiKey,
  });

  const res = await fetch(`${GOOGLE_PLACES_BASE_URL}?${query.toString()}`);
  const data = await res.json();

  return (data.results || []).map((place) => ({
    id: place.place_id,
    name: place.name,
    rating: place.rating,
    priceLevel: place.price_level,
    address: place.vicinity,
    lat: place.geometry?.location?.lat,
    lng: place.geometry?.location?.lng,
    imageUrl: place.photos?.[0]
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${place.photos[0].photo_reference}&key=${apiKey}`
      : "https://via.placeholder.com/800x600?text=No+Image",
  }));
}
