// // app/_layout.js
// import { checkAuthStatus } from '@/redux/authSlice';
// import { store } from '@/redux/store';
// import { configureNotifications } from '@/services/notifications';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Slot, useRouter, useSegments } from 'expo-router';
// import * as SplashScreen from 'expo-splash-screen';
// // import LottieView from 'lottie-react-native';
// import { COLORS } from '@/constants/Colors';
// import React, { useEffect, useState } from 'react';
// import { View } from 'react-native';
// import { Provider, useDispatch, useSelector } from 'react-redux';

// // Empêcher le splash screen de se cacher automatiquement
// SplashScreen.preventAutoHideAsync();

// function RootLayoutNav() {
//   const { isAuthenticated, loading } = useSelector((state) => state.auth);
//   const dispatch = useDispatch();
//   const router = useRouter();
//   const segments = useSegments();
  
//   const [appIsReady, setAppIsReady] = useState(false);
//   const [showOnboarding, setShowOnboarding] = useState(true);

//   useEffect(() => {
//     async function prepare() {
//       try {
//         // Vérifier le statut d'authentification
//         await dispatch(checkAuthStatus());
        
//         // Configurer les notifications
//         try {
//           await configureNotifications();
//         } catch (error) {
//           console.warn('Erreur configuration notifications:', error);
//         }
        
//         // // Demander les permissions de localisation
//         // await requestLocationPermissions();
        
//         // Vérifier si c'est le premier lancement
//         const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
//         setShowOnboarding(!hasSeenOnboarding);
        
//       } catch (error) {
//         console.warn('Erreur initialisation app:', error);
//       } finally {
//         setAppIsReady(true);
//         await SplashScreen.hideAsync();
//       }
//     }

//     prepare();
//   }, []);

//   useEffect(() => {
//     if (!appIsReady || loading) return;

//     const inAuthGroup = segments[0] === '(auth)';
//     const inOnboarding = segments[0] === 'onboarding';

//     if (showOnboarding && !inOnboarding) {
//       router.replace('/onboarding');
//     } else if (!showOnboarding) {
//       if (isAuthenticated && inAuthGroup) {
//         router.replace('/(tabs)/dashboard');
//       } 
//       else if (!isAuthenticated && !inAuthGroup) {
//         router.replace('/(auth)/login');
//       }
//     }
//   }, [isAuthenticated, segments, appIsReady, loading, showOnboarding]);

//   if (!appIsReady || loading) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white }}>
//         {/* <LottieView
//           source={require('@/assets/animations/loading.json')}
//           autoPlay
//           loop
//           style={{ width: 200, height: 200 }}
//         /> */}
//       </View>
//     );
//   }

//   return <Slot />;
// }

// export default function RootLayout() {
//   return (
//     <Provider store={store}>
//       <RootLayoutNav />
//     </Provider>
//   );
// }



// app/_layout.tsx
import { COLORS } from '@/constants/Colors';
import { checkAuthStatus } from '@/redux/authSlice';
import { store } from '@/redux/store';
import { configureNotifications } from '@/services/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { Provider, useDispatch, useSelector } from 'react-redux';

// Empêcher le splash screen de se cacher automatiquement
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();
  const segments = useSegments();
  const [appIsReady, setAppIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const notificationListener = useRef();
  const responseListener = useRef();

  // ✅ Configuration des notifications Expo
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    console.log('🔔 Configuration des notifications Expo pour:', user.username);

    // ✅ Configuration du handler de notifications
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // ✅ Écouter les notifications reçues (app ouverte)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notification reçue (app ouverte):', {
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data
      });

      // Afficher une alerte personnalisée pour les nouvelles commandes
      if (notification.request.content.data?.type === 'nouvelle_commande') {
        Alert.alert(
          notification.request.content.title || '🍽️ Nouvelle commande !',
          notification.request.content.body || 'Une nouvelle commande est disponible',
          [
            { 
              text: 'Ignorer', 
              style: 'cancel' 
            },
            { 
              text: 'Voir commande', 
              onPress: () => {
                console.log('📱 Navigation vers livraisons...');
                router.push('/(tabs)/livraisons');
              }
            }
          ]
        );
      }
    });

    // ✅ Écouter les interactions avec les notifications (tap sur notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('🔔 Notification tapée:', {
        title: response.notification.request.content.title,
        data: response.notification.request.content.data
      });

      // Navigation automatique selon le type
      if (response.notification.request.content.data?.type === 'nouvelle_commande') {
        setTimeout(() => {
          router.push('/(tabs)/livraisons');
        }, 1000);
      }
    });

    // ✅ Vérifier si l'app a été lancée via une notification
    Notifications.getLastNotificationResponseAsync()
      .then(response => {
        if (response?.notification.request.content.data?.type === 'nouvelle_commande') {
          console.log('🔔 App lancée via notification');
          setTimeout(() => {
            router.push('/(tabs)/livraisons');
          }, 2000);
        }
      })
      .catch(error => {
        console.error('❌ Erreur getLastNotificationResponse:', error);
      });

    // ✅ Nettoyage des listeners
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [isAuthenticated, user, router]);

  // ✅ Initialisation de l'app
  useEffect(() => {
    async function prepare() {
      try {
        console.log('🚀 Initialisation de l\'application Expo...');
        
        // Vérifier le statut d'authentification
        await dispatch(checkAuthStatus());
        
        // Configurer les notifications Expo
        try {
          await configureNotifications();
          console.log('✅ Notifications Expo configurées');
        } catch (error) {
          console.warn('⚠️ Erreur configuration notifications:', error);
        }

        // Vérifier si c'est le premier lancement
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        setShowOnboarding(!hasSeenOnboarding);
        
        console.log('✅ Initialisation terminée');
      } catch (error) {
        console.warn('❌ Erreur initialisation app:', error);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, [dispatch]);

  // ✅ Gestion de la navigation
  useEffect(() => {
    if (!appIsReady || loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inOnboarding = segments[0] === 'onboarding';

    console.log('🧭 Navigation - État:', {
      isAuthenticated,
      showOnboarding,
      currentSegment: segments[0],
      inAuthGroup,
      inTabsGroup,
      inOnboarding
    });

    if (showOnboarding && !inOnboarding) {
      console.log('📋 Redirection vers onboarding');
      router.replace('/onboarding');
    } else if (!showOnboarding) {
      if (isAuthenticated) {
        if (!inTabsGroup) {
          console.log('🏠 Redirection vers dashboard (authentifié)');
          router.replace('/(tabs)/dashboard');
        }
      } else {
        if (!inAuthGroup) {
          console.log('🔑 Redirection vers login (non authentifié)');
          router.replace('/(auth)/login');
        }
      }
    }
  }, [isAuthenticated, segments, appIsReady, loading, showOnboarding, router]);

  // ✅ Écran de chargement
  if (!appIsReady || loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: COLORS.white 
      }}>
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