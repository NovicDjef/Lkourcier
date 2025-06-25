import { COLORS } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

export default function InitialLoader() {
  const loaderAnim = useRef(new Animated.Value(0)).current;

  // 🔥 AJOUT : Animation du loader au montage du composant
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(loaderAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(loaderAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [loaderAnim]);

  return (
    <View style={styles.loaderContainer}>
      <View style={styles.loaderContent}>
        {/* Logo ou icône principale */}
        <Animated.View
          style={[
            styles.loaderIcon,
            {
              opacity: loaderAnim,
              transform: [{
                scale: loaderAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2]
                })
              }]
            }
          ]}
        >
          <Ionicons name="bicycle" size={60} color={COLORS.primary} />
        </Animated.View>

        {/* Texte de chargement */}
        <Text style={styles.loaderTitle}>Chargement de votre dashboard</Text>
        <Text style={styles.loaderSubtitle}>Récupération des données...</Text>

        {/* Barre de progression animée */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: loaderAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['20%', '90%']
                  })
                }
              ]}
            />
          </View>
        </View>

        {/* Points de chargement animés */}
        <View style={styles.dotsContainer}>
          {[0, 1, 2].map((index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  opacity: loaderAnim.interpolate({
                    inputRange: [0, 0.33, 0.66, 1],
                    outputRange: index === 0 ? [0.3, 1, 0.3, 0.3] :
                                 index === 1 ? [0.3, 0.3, 1, 0.3] :
                                               [0.3, 0.3, 0.3, 1]
                  })
                }
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 40,
  },
  loaderContent: {
    alignItems: 'center',
    width: '100%',
  },
  loaderIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  loaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  loaderSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 40,
    textAlign: 'center',
  },
  // 🔥 AJOUT : Styles manquants pour la barre de progression
  progressContainer: {
    width: '100%',
    marginBottom: 30,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E7FF',
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  // 🔥 AJOUT : Styles manquants pour les points animés
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginHorizontal: 4,
  },
});