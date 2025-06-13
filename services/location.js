
// services/location.js
import * as Location from 'expo-location';
import { Alert } from 'react-native';

export const requestLocationPermissions = async () => {
  try {
    // Permission en premier plan
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (foregroundStatus !== 'granted') {
      Alert.alert(
        'Permission requise',
        'L\'accès à la localisation est nécessaire pour les livraisons.'
      );
      return false;
    }

    // Permission en arrière-plan (pour le tracking continu)
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    
    if (backgroundStatus !== 'granted') {
      Alert.alert(
        'Localisation en arrière-plan',
        'Pour un meilleur suivi, autorisez la localisation en arrière-plan.'
      );
    }

    return true;
  } catch (error) {
    console.error('Erreur permissions localisation:', error);
    return false;
  }
};

export const getCurrentLocation = async () => {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Erreur récupération position:', error);
    throw error;
  }
};

export const startLocationTracking = async (callback) => {
  try {
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // 10 secondes
        distanceInterval: 50, // 50 mètres
      },
      callback
    );
    return subscription;
  } catch (error) {
    console.error('Erreur démarrage tracking:', error);
    throw error;
  }
};