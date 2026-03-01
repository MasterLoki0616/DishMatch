import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Swiper from "react-native-deck-swiper";
import * as Location from "expo-location";
import {
  arrayUnion,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "./src/services/firebase";
import { fetchNearbyRestaurants } from "./src/services/placesService";

/**
 * NOTE: This is MVP boilerplate focused on swiping + match logic.
 * Session creation/join can be handled in a preceding screen and passed here.
 */
export default function App() {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState([]);
  const [sessionId] = useState("REPLACE_WITH_SESSION_ID");
  const [participantUids, setParticipantUids] = useState([]);
  const [matchRestaurant, setMatchRestaurant] = useState(null);

  const uid = auth.currentUser?.uid;
  const sessionRef = useMemo(() => doc(db, "sessions", sessionId), [sessionId]);

  useEffect(() => {
    let unsub;

    async function bootstrap() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location needed",
          "Please enable location to discover nearby restaurants.",
        );
        setLoading(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({});
      const restaurants = await fetchNearbyRestaurants({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        radiusMeters: 5000,
      });

      setCards(restaurants);

      // Keep session doc in sync for participant list + match state.
      unsub = onSnapshot(sessionRef, (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        setParticipantUids(data.participants || []);

        if (data.matchedRestaurantId) {
          const found = (data.restaurants || []).find(
            (r) => r.id === data.matchedRestaurantId,
          );
          setMatchRestaurant(found || null);
        }
      });

      setLoading(false);
    }

    bootstrap();
    return () => unsub?.();
  }, [sessionRef]);

  const onSwipeLeft = async (cardIndex) => {
    const restaurant = cards[cardIndex];
    if (!restaurant || !uid) return;

    await updateDoc(sessionRef, {
      updatedAt: serverTimestamp(),
    });
  };

  const onSwipeRight = async (cardIndex) => {
    const restaurant = cards[cardIndex];
    if (!restaurant || !uid) return;

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(sessionRef);
      if (!snap.exists()) return;

      const data = snap.data();
      const participants = data.participants || [];
      const likesByRestaurant = data.likesByRestaurant || {};
      const currentLikes = likesByRestaurant[restaurant.id] || [];

      const nextLikes = currentLikes.includes(uid)
        ? currentLikes
        : [...currentLikes, uid];
      const updates = {
        [`likesByRestaurant.${restaurant.id}`]: arrayUnion(uid),
        updatedAt: serverTimestamp(),
      };

      // Core match engine: both participants liked the same restaurant.
      const isMatch =
        participants.length === 2 &&
        participants.every((participantUid) =>
          nextLikes.includes(participantUid),
        );

      if (isMatch && !data.matchedRestaurantId) {
        updates.matchedRestaurantId = restaurant.id;
        updates.status = "matched";
      }

      transaction.update(sessionRef, updates);
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading nearby restaurants...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>DishMatch</Text>
      <Text style={styles.subHeader}>
        Participants: {participantUids.length}/2
      </Text>

      <View style={styles.swiperContainer}>
        <Swiper
          cards={cards}
          renderCard={(card) => {
            if (!card) return <View style={styles.card} />;
            return (
              <View style={styles.card}>
                <Image source={{ uri: card.imageUrl }} style={styles.image} />
                <Text style={styles.name}>{card.name}</Text>
                <Text>⭐ {card.rating ?? "N/A"}</Text>
                <Text>💲{"$".repeat(card.priceLevel || 1)}</Text>
              </View>
            );
          }}
          onSwipedLeft={onSwipeLeft}
          onSwipedRight={onSwipeRight}
          backgroundColor="transparent"
          stackSize={3}
          disableTopSwipe
          disableBottomSwipe
        />
      </View>

      <Modal visible={!!matchRestaurant} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <Text style={styles.matchTitle}>🎉 It's a Match!</Text>
            <Text style={styles.matchName}>{matchRestaurant?.name}</Text>
            <Text style={styles.matchMeta}>{matchRestaurant?.address}</Text>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>View on Map</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF8F2" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 8 },
  header: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 16,
  },
  subHeader: { textAlign: "center", color: "#666", marginBottom: 8 },
  swiperContainer: { flex: 1, marginBottom: 24 },
  card: {
    flex: 0.75,
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  image: { width: "100%", height: 220, borderRadius: 12, marginBottom: 12 },
  name: { fontSize: 20, fontWeight: "600", marginBottom: 4 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  overlayCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  matchTitle: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  matchName: { fontSize: 22, textAlign: "center", marginBottom: 6 },
  matchMeta: { textAlign: "center", color: "#666", marginBottom: 16 },
  button: { backgroundColor: "#FF6B35", borderRadius: 10, padding: 12 },
  buttonText: { color: "white", textAlign: "center", fontWeight: "600" },
});
