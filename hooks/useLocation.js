import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          setErrorMsg('Permission de localisation refusée');
          setLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        setLocation(location);
      } catch (error) {
        setErrorMsg('Erreur lors de la récupération de la position');
        console.error('Erreur de localisation:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const requestPermission = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'Cette application nécessite l\'accès à votre position pour fonctionner correctement.',
          [
            {
              text: 'Annuler',
              style: 'cancel',
            },
            {
              text: 'Paramètres',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    location,
    errorMsg,
    loading,
    requestPermission,
  };
}; 