import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
// import LottieView from 'lottie-react-native';
import { COLORS } from "@/constants/Colors";
import { requestLocationPermissions } from '@/services/location';
import { configureNotifications } from '@/services/notifications';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');
// app/onboarding/permissions.js
const PermissionsScreen = () => {
  const [locationGranted, setLocationGranted] = useState(false);
  const [notificationGranted, setNotificationGranted] = useState(false);

  const requestLocationPermission = async () => {
    const granted = await requestLocationPermissions();
    setLocationGranted(granted);
  };

  const requestNotificationPermission = async () => {
    try {
      await configureNotifications();
      setNotificationGranted(true);
    } catch (error) {
      console.error('Erreur notifications:', error);
    }
  };

  const handleContinue = async () => {
    if (locationGranted && notificationGranted) {
      await AsyncStorage.setItem('permissionsGranted', 'true');
      router.replace('/(auth)/login');
    } else {
      Alert.alert(
        'Permissions requises',
        'Toutes les permissions sont nécessaires pour utiliser l\'application.'
      );
    }
  };

  return (
    <View style={styles.permissionsContainer}>
      {/* <LottieView
        source={require('@/assets/animations/permissions.json')}
        autoPlay
        loop
        style={styles.permissionsAnimation}
      /> */}
      
      <Text style={styles.permissionsTitle}>Permissions requises</Text>
      <Text style={styles.permissionsSubtitle}>
        Pour vous offrir la meilleure expérience, nous avons besoin d'accéder à :
      </Text>

      <View style={styles.permissionsList}>
        <TouchableOpacity
          style={styles.permissionItem}
          onPress={requestLocationPermission}
        >
          <View style={styles.permissionIcon}>
            <Ionicons 
              name="location" 
              size={24} 
              color={locationGranted ? COLORS.primary : COLORS.gray} 
            />
          </View>
          <View style={styles.permissionText}>
            <Text style={styles.permissionTitle}>Localisation</Text>
            <Text style={styles.permissionDescription}>
              Pour vous localiser et calculer les itinéraires
            </Text>
          </View>
          <Ionicons 
            name={locationGranted ? "checkmark-circle" : "chevron-forward"} 
            size={24} 
            color={locationGranted ? COLORS.primary : COLORS.gray} 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.permissionItem}
          onPress={requestNotificationPermission}
        >
          <View style={styles.permissionIcon}>
            <Ionicons 
              name="notifications" 
              size={24} 
              color={notificationGranted ? COLORS.primary : COLORS.gray} 
            />
          </View>
          <View style={styles.permissionText}>
            <Text style={styles.permissionTitle}>Notifications</Text>
            <Text style={styles.permissionDescription}>
              Pour recevoir les nouvelles commandes
            </Text>
          </View>
          <Ionicons 
            name={notificationGranted ? "checkmark-circle" : "chevron-forward"} 
            size={24} 
            color={notificationGranted ? COLORS.primary : COLORS.gray} 
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.continueButton,
          (locationGranted && notificationGranted) ? styles.continueButtonActive : styles.continueButtonDisabled
        ]}
        onPress={handleContinue}
      >
        <Text style={styles.continueButtonText}>Continuer</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
 
  // Permissions styles
  permissionsContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  permissionsAnimation: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginBottom: 30,
  },
  permissionsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 10,
  },
  permissionsSubtitle: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  permissionsList: {
    marginBottom: 40,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  permissionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  permissionText: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 5,
  },
  permissionDescription: {
    fontSize: 14,
    color: COLORS.gray,
  },
  continueButton: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonActive: {
    backgroundColor: COLORS.primary,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PermissionsScreen;