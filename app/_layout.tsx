// app/_layout.js
import { checkAuthStatus } from '@/redux/authSlice';
import { store } from '@/redux/store';
import { requestLocationPermissions } from '@/services/location';
import { configureNotifications } from '@/services/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
// import LottieView from 'lottie-react-native';
import { COLORS } from '@/constants/Colors';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Provider, useDispatch, useSelector } from 'react-redux';

// Empêcher le splash screen de se cacher automatiquement
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();
  const segments = useSegments();
  
  const [appIsReady, setAppIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    async function prepare() {
      try {
        // Vérifier le statut d'authentification
        await dispatch(checkAuthStatus());
        
        // Configurer les notifications
        try {
          await configureNotifications();
        } catch (error) {
          console.warn('Erreur configuration notifications:', error);
        }
        
        // Demander les permissions de localisation
        await requestLocationPermissions();
        
        // Vérifier si c'est le premier lancement
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        setShowOnboarding(!hasSeenOnboarding);
        
      } catch (error) {
        console.warn('Erreur initialisation app:', error);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (!appIsReady || loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (showOnboarding && !inOnboarding) {
      router.replace('/onboarding');
    } else if (!showOnboarding) {
      if (isAuthenticated && inAuthGroup) {
        router.replace('/(tabs)/dashboard');
      } 
      else if (!isAuthenticated && !inAuthGroup) {
        router.replace('/(auth)/login');
      }
    }
  }, [isAuthenticated, segments, appIsReady, loading, showOnboarding]);

  if (!appIsReady || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white }}>
        {/* <LottieView
          source={require('@/assets/animations/loading.json')}
          autoPlay
          loop
          style={{ width: 200, height: 200 }}
        /> */}
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <RootLayoutNav />
    </Provider>
  );
}
