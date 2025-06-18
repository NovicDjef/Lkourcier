// // app/(tabs)/dashboard.js
// import { COLORS } from '@/constants/Colors';
// import {
//   acceptCommande,
//   fetchLivreurStats,
//   fetchPendingCommandes,
//   rejectCommande,
//   updateLivreurLocation,
//   updateLivreurStatus,
// } from '@/redux/livraisonSlice';
// import { Ionicons } from '@expo/vector-icons';
// import * as Location from 'expo-location';
// import * as Notifications from 'expo-notifications';
// import { router } from 'expo-router';
// import React, { useEffect, useRef, useState } from 'react';
// import {
//   Alert,
//   Animated,
//   Image,
//   Modal,
//   RefreshControl,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from 'react-native';
// import { useDispatch, useSelector } from 'react-redux';


// const DashboardScreen = () => {
//   const dispatch = useDispatch();
//   const { user } = useSelector((state) => state.auth);
//   const { stats, pendingCommandes, isOnline } = useSelector(
//     (state) => state.livraison
//   );

//   const [refreshing, setRefreshing] = useState(false);
//   const [newCommandeModal, setNewCommandeModal] = useState(false);
//   const [currentCommande, setCurrentCommande] = useState(null);
//   const [timeLeft, setTimeLeft] = useState(30); // 30 secondes pour accepter
  
//   const notificationListener = useRef();
//   const responseListener = useRef();
//   const animatedValue = useRef(new Animated.Value(0)).current;
//   const countdownInterval = useRef(null);

//   useEffect(() => {
//     initializeApp();
//     setupNotifications();
    
//     return () => {
//       if (notificationListener.current) {
//         Notifications.removeNotificationSubscription(notificationListener.current);
//       }
//       if (responseListener.current) {
//         Notifications.removeNotificationSubscription(responseListener.current);
//       }
//       if (countdownInterval.current) {
//         clearInterval(countdownInterval.current);
//       }
//     };
//   }, []);

//   const initializeApp = async () => {
//     // Charger les statistiques et commandes en attente
//     dispatch(fetchLivreurStats());
//     dispatch(fetchPendingCommandes());
    
//     // Demander permissions de localisation
//     await requestLocationPermission();
//   };

//   const requestLocationPermission = async () => {
//     const { status } = await Location.requestForegroundPermissionsAsync();
//     if (status !== 'granted') {
//       Alert.alert(
//         'Permission requise',
//         'La localisation est nécessaire pour recevoir des commandes.'
//       );
//       return;
//     }

//     // Démarrer le suivi de localisation
//     startLocationTracking();
//   };

//   const startLocationTracking = async () => {
//     try {
//       const subscription = await Location.watchPositionAsync(
//         {
//           accuracy: Location.Accuracy.High,
//           timeInterval: 10000, // 10 secondes
//           distanceInterval: 50, // 50 mètres
//         },
//         (location) => {
//           dispatch(updateLivreurLocation(location.coords));
//         }
//       );
//     } catch (error) {
//       console.error('Erreur tracking localisation:', error);
//     }
//   };

//   const setupNotifications = async () => {
//     // Configuration des notifications
//     await Notifications.setNotificationHandler({
//       handleNotification: async () => ({
//         shouldShowAlert: true,
//         shouldPlaySound: true,
//         shouldSetBadge: false,
//       }),
//     });

//     // Écouter les notifications reçues
//     notificationListener.current = Notifications.addNotificationReceivedListener(
//       (notification) => {
//         const { data } = notification.request.content;
//         if (data?.type === 'NEW_COMMANDE') {
//           handleNewCommandeNotification(data);
//         }
//       }
//     );

//     // Écouter les réponses aux notifications
//     responseListener.current = Notifications.addNotificationResponseReceivedListener(
//       (response) => {
//         const { data } = response.notification.request.content;
//         if (data?.commandeId) {
//           router.push(`/livraison/${data.commandeId}`);
//         }
//       }
//     );
//   };

//   const handleNewCommandeNotification = (data) => {
//     const commande = {
//       id: data.commandeId,
//       restaurant: data.restaurant,
//       client: data.client,
//       distance: data.distance,
//       prix: data.prix,
//       adresse: data.adresse,
//     };

//     setCurrentCommande(commande);
//     setTimeLeft(30);
//     setNewCommandeModal(true);
    
//     // Animation d'attention
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(animatedValue, {
//           toValue: 1,
//           duration: 500,
//           useNativeDriver: true,
//         }),
//         Animated.timing(animatedValue, {
//           toValue: 0,
//           duration: 500,
//           useNativeDriver: true,
//         }),
//       ])
//     ).start();

//     // Countdown
//     countdownInterval.current = setInterval(() => {
//       setTimeLeft((prev) => {
//         if (prev <= 1) {
//           handleRejectCommande(); // Auto-refus
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);
//   };

//   const handleAcceptCommande = async () => {
//     if (!currentCommande) return;

//     try {
//       const result = await dispatch(acceptCommande(currentCommande.id));
      
//       if (acceptCommande.fulfilled.match(result)) {
//         closeCommandeModal();
//         router.push(`/livraison/${currentCommande.id}`);
//       } else {
//         Alert.alert('Erreur', 'Impossible d\'accepter la commande');
//       }
//     } catch (error) {
//       Alert.alert('Erreur', 'Une erreur est survenue');
//     }
//   };

//   const handleRejectCommande = async () => {
//     if (!currentCommande) return;

//     await dispatch(rejectCommande(currentCommande.id));
//     closeCommandeModal();
//   };

//   const closeCommandeModal = () => {
//     setNewCommandeModal(false);
//     setCurrentCommande(null);
//     if (countdownInterval.current) {
//       clearInterval(countdownInterval.current);
//     }
//     animatedValue.stopAnimation();
//   };

//   const toggleOnlineStatus = async () => {
//     const newStatus = !isOnline;
//     dispatch(updateLivreurStatus(newStatus));
    
//     if (newStatus) {
//       await startLocationTracking();
//     }
//   };

//   const onRefresh = React.useCallback(() => {
//     setRefreshing(true);
//     Promise.all([
//       dispatch(fetchLivreurStats()),
//       dispatch(fetchPendingCommandes()),
//     ]).finally(() => setRefreshing(false));
//   }, []);

//   return (
//     <View style={styles.container}>
//       {/* Header */}
//       <View style={styles.header}>
//         <View style={styles.headerContent}>
//           <Image
//             source={{ uri: user?.photo || 'https://via.placeholder.com/50' }}
//             style={styles.profileImage}
//           />
//           <View style={styles.headerText}>
//             <Text style={styles.welcomeText}>Bonjour,</Text>
//             <Text style={styles.userName}>{user?.prenom} {user?.nom}</Text>
//           </View>
//           <TouchableOpacity
//             style={[styles.statusButton, isOnline ? styles.online : styles.offline]}
//             onPress={toggleOnlineStatus}
//           >
//             <View style={styles.statusDot} />
//             <Text style={styles.statusText}>
//               {isOnline ? 'En ligne' : 'Hors ligne'}
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       <ScrollView
//         style={styles.content}
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//         }
//       >
//         {/* Statistiques */}
//         <View style={styles.statsContainer}>
//           <View style={styles.statCard}>
//             <Ionicons name="trophy" size={30} color={COLORS.warning} />
//             <Text style={styles.statNumber}>{stats?.totalLivraisons || 0}</Text>
//             <Text style={styles.statLabel}>Livraisons</Text>
//           </View>
          
//           <View style={styles.statCard}>
//             <Ionicons name="star" size={30} color={COLORS.warning} />
//             <Text style={styles.statNumber}>{stats?.note || '5.0'}</Text>
//             <Text style={styles.statLabel}>Note</Text>
//           </View>
          
//           <View style={styles.statCard}>
//             <Ionicons name="cash" size={30} color={COLORS.success} />
//             <Text style={styles.statNumber}>{stats?.gainsJour || '0'} F</Text>
//             <Text style={styles.statLabel}>Aujourd'hui</Text>
//           </View>
//         </View>

//         {/* Actions rapides */}
//         <View style={styles.quickActions}>
//           <Text style={styles.sectionTitle}>Actions rapides</Text>
          
//           <TouchableOpacity
//             style={styles.actionCard}
//             onPress={() => router.push('/livraisons')}
//           >
//             <Ionicons name="list" size={24} color={COLORS.primary} />
//             <Text style={styles.actionText}>Mes livraisons</Text>
//             <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.actionCard}
//             onPress={() => router.push('/historique')}
//           >
//             <Ionicons name="time" size={24} color={COLORS.secondary} />
//             <Text style={styles.actionText}>Historique</Text>
//             <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.actionCard}
//             onPress={() => router.push('/profil')}
//           >
//             <Ionicons name="person" size={24} color={COLORS.primary} />
//             <Text style={styles.actionText}>Mon profil</Text>
//             <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
//           </TouchableOpacity>
//         </View>

//         {/* État du jour */}
//         <View style={styles.todaySection}>
//           <Text style={styles.sectionTitle}>Aujourd'hui</Text>
//           <View style={styles.todayCard}>
//             <Text style={styles.todayText}>
//               {isOnline ? 
//                 'Vous êtes en ligne et prêt à recevoir des commandes!' : 
//                 'Passez en ligne pour recevoir des commandes'
//               }
//             </Text>
//             {!isOnline && (
//               <TouchableOpacity
//                 style={styles.goOnlineButton}
//                 onPress={toggleOnlineStatus}
//               >
//                 <Text style={styles.goOnlineText}>Passer en ligne</Text>
//               </TouchableOpacity>
//             )}
//           </View>
//         </View>
//       </ScrollView>

//       {/* Modal Nouvelle Commande */}
//       <Modal
//         visible={newCommandeModal}
//         transparent={true}
//         animationType="slide"
//       >
//         <View style={styles.modalOverlay}>
//           <Animated.View
//             style={[
//               styles.modalContent,
//               {
//                 transform: [{
//                   scale: animatedValue.interpolate({
//                     inputRange: [0, 1],
//                     outputRange: [1, 1.05],
//                   }),
//                 }],
//               },
//             ]}
//           >
//             <View style={styles.modalHeader}>
//               <Ionicons name="notifications" size={40} color={COLORS.warning} />
//               <Text style={styles.modalTitle}>Nouvelle Commande!</Text>
//               <Text style={styles.countdown}>{timeLeft}s</Text>
//             </View>

//             {currentCommande && (
//               <View style={styles.commandeDetails}>
//                 <View style={styles.detailRow}>
//                   <Ionicons name="restaurant" size={20} color={COLORS.primary} />
//                   <Text style={styles.detailText}>{currentCommande.restaurant}</Text>
//                 </View>
                
//                 <View style={styles.detailRow}>
//                   <Ionicons name="location" size={20} color={COLORS.secondary} />
//                   <Text style={styles.detailText}>{currentCommande.adresse}</Text>
//                 </View>
                
//                 <View style={styles.detailRow}>
//                   <Ionicons name="car" size={20} color={COLORS.gray} />
//                   <Text style={styles.detailText}>{currentCommande.distance}</Text>
//                 </View>
                
//                 <View style={styles.detailRow}>
//                   <Ionicons name="cash" size={20} color={COLORS.success} />
//                   <Text style={styles.detailText}>{currentCommande.prix} FCFA</Text>
//                 </View>
//               </View>
//             )}

//             <View style={styles.modalActions}>
//               <TouchableOpacity
//                 style={styles.rejectButton}
//                 onPress={handleRejectCommande}
//               >
//                 <Text style={styles.rejectText}>Refuser</Text>
//               </TouchableOpacity>
              
//               <TouchableOpacity
//                 style={styles.acceptButton}
//                 onPress={handleAcceptCommande}
//               >
//                 <Text style={styles.acceptText}>Accepter</Text>
//               </TouchableOpacity>
//             </View>
//           </Animated.View>
//         </View>
//       </Modal>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.light,
//   },
//   header: {
//     backgroundColor: COLORS.white,
//     paddingTop: 50,
//     paddingHorizontal: 20,
//     paddingBottom: 20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   headerContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   profileImage: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     marginRight: 15,
//   },
//   headerText: {
//     flex: 1,
//   },
//   welcomeText: {
//     fontSize: 14,
//     color: COLORS.gray,
//   },
//   userName: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: COLORS.dark,
//   },
//   statusButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 15,
//   },
//   online: {
//     backgroundColor: COLORS.success + '20',
//   },
//   offline: {
//     backgroundColor: COLORS.gray + '20',
//   },
//   statusDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: COLORS.success,
//     marginRight: 5,
//   },
//   statusText: {
//     fontSize: 12,
//     fontWeight: 'bold',
//     color: COLORS.success,
//   },
//   content: {
//     flex: 1,
//     padding: 20,
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 25,
//   },
//   statCard: {
//     backgroundColor: COLORS.white,
//     borderRadius: 15,
//     padding: 20,
//     alignItems: 'center',
//     flex: 1,
//     marginHorizontal: 5,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   statNumber: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: COLORS.dark,
//     marginVertical: 5,
//   },
//   statLabel: {
//     fontSize: 12,
//     color: COLORS.gray,
//   },
//   quickActions: {
//     marginBottom: 25,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: COLORS.dark,
//     marginBottom: 15,
//   },
//   actionCard: {
//     backgroundColor: COLORS.white,
//     borderRadius: 12,
//     padding: 15,
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   actionText: {
//     flex: 1,
//     marginLeft: 15,
//     fontSize: 16,
//     color: COLORS.dark,
//   },
//   todaySection: {
//     marginBottom: 20,
//   },
//   todayCard: {
//     backgroundColor: COLORS.white,
//     borderRadius: 12,
//     padding: 20,
//     alignItems: 'center',
//   },
//   todayText: {
//     fontSize: 16,
//     color: COLORS.gray,
//     textAlign: 'center',
//     marginBottom: 15,
//   },
//   goOnlineButton: {
//     backgroundColor: COLORS.primary,
//     borderRadius: 8,
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//   },
//   goOnlineText: {
//     color: COLORS.white,
//     fontWeight: 'bold',
//   },
//   // Modal styles
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   modalContent: {
//     backgroundColor: COLORS.white,
//     borderRadius: 20,
//     padding: 25,
//     margin: 20,
//     width: '90%',
//   },
//   modalHeader: {
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: COLORS.dark,
//     marginVertical: 10,
//   },
//   countdown: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: COLORS.error,
//   },
//   commandeDetails: {
//     marginBottom: 25,
//   },
//   detailRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   detailText: {
//     marginLeft: 10,
//     fontSize: 14,
//     color: COLORS.dark,
//   },
//   modalActions: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   rejectButton: {
//     backgroundColor: COLORS.error,
//     borderRadius: 10,
//     paddingVertical: 12,
//     paddingHorizontal: 30,
//   },
//   acceptButton: {
//     backgroundColor: COLORS.success,
//     borderRadius: 10,
//     paddingVertical: 12,
//     paddingHorizontal: 30,
//   },
//   rejectText: {
//     color: COLORS.white,
//     fontWeight: 'bold',
//   },
//   acceptText: {
//     color: COLORS.white,
//     fontWeight: 'bold',
//   },
// });

// export default DashboardScreen;




// ===== DASHBOARD LIVREUR AVEC NOTIFICATIONS =====

import { NotificationHandler } from '@/components/livraison/NotificationHandler';
import { COLORS } from '@/constants/Colors';
import { useLivraison } from '@/hooks/useLivraison';
// import {
//   clearError,
//   registerPushToken,
//   updateLivreurStatus
// } from '@/redux/livraisonSlice';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

export default function DashboardScreen() {
  const dispatch = useDispatch();
  const livraison = useLivraison(); // Hook personnalisé
  
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const { user, loading, error } = useSelector(state => state.auth); // ✅ Utilisez Redux state
  const  commandesDisponibles = useSelector(state => state.commande.commandes);
  const [isOnline, setIsOnline] = useState(user?.disponible || false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (user?.disponible !== undefined) {
      const newOnlineStatus = user.disponible;
      
      if (newOnlineStatus !== isOnline) {
        Animated.timing(fadeAnim, {
          toValue: newOnlineStatus ? 0 : 1, // 0 = masqué, 1 = visible
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setIsOnline(newOnlineStatus);
        });
      }
    }
  }, [user?.disponible]);

  useEffect(() => {
    initializeDashboard();
    checkNotificationPermissions();
    console.log("commandesDisponibles :", commandesDisponibles);
  }, []);

  useEffect(() => {
    // Charger les données si le livreur est en ligne
    if (livraison.isOnline && user?.id) {
      loadDashboardData();
    }
  }, [livraison.isOnline, user?.id]);

  const initializeDashboard = async () => {
    try {
      // Les données sont déjà chargées via le hook useLivraison
      console.log('📱 Dashboard initialisé');
    } catch (error) {
      console.error('❌ Erreur initialisation dashboard:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      const livreurId = await AsyncStorage.getItem('livreurId') || user?.id;
      
      if (livreurId) {
        // Charger les données via Redux
        await Promise.all([
          // dispatch(fetchLivreurStats(parseInt(livreurId))),
          //dispatch(fetchActiveLivraisons(parseInt(livreurId)))
        ]);
      }
    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
    }
  };

  const checkNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationsEnabled(status === 'granted');
    } catch (error) {
      console.error('❌ Erreur vérification permissions:', error);
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      const newStatus = !isOnline;
      const livreurId = user?.id;
      
      if (!livreurId) {
        Alert.alert('Erreur', 'Identifiant livreur manquant');
        return;
      }

      // Vérifier les permissions de notification avant de passer en ligne
      if (newStatus && !notificationsEnabled) {
        Alert.alert(
          'Notifications requises',
          'Vous devez activer les notifications pour recevoir les commandes.',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Activer', onPress: () => requestNotificationPermissions() }
          ]
        );
        return;
      }

      console.log('🔄 Changement statut:', { livreurId, newStatus });

      // ✅ Mettre à jour l'état local immédiatement pour l'UX
      setIsOnline(newStatus);

      // Mettre à jour via Redux
      const result = await dispatch(updateLivreurStatus({
        livreurId: parseInt(livreurId),
        disponible: newStatus
      }));

      if (updateLivreurStatus.fulfilled.match(result)) {
        console.log('✅ Statut mis à jour avec succès');
        
        if (newStatus) {
          // Enregistrer le token push si en ligne
          await handleRegisterPushToken();
        }

        Alert.alert(
          'Statut mis à jour',
          `Vous êtes maintenant ${newStatus ? 'en ligne' : 'hors ligne'}${newStatus ? ' et prêt à recevoir des commandes' : ''}`
        );

        // Charger les données si en ligne
        if (newStatus) {
          loadDashboardData();
        }
      } else {
        // ✅ Restaurer l'état en cas d'erreur
        console.error('❌ Erreur mise à jour:', result.payload);
        setIsOnline(!newStatus); // Revenir à l'état précédent
        Alert.alert('Erreur', result.payload || 'Impossible de mettre à jour votre statut');
      }
    } catch (error) {
      console.error('❌ Erreur changement statut:', error);
      // ✅ Restaurer l'état en cas d'erreur
      setIsOnline(!newStatus);
      Alert.alert('Erreur', 'Impossible de mettre à jour votre statut');
    }
  };

  const requestNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationsEnabled(status === 'granted');
      
      if (status === 'granted') {
        await handleRegisterPushToken();
        Alert.alert('Notifications activées', 'Vous pouvez maintenant passer en ligne');
      } else {
        Alert.alert(
          'Permissions refusées',
          'Vous ne pourrez pas recevoir de notifications de commandes'
        );
      }
    } catch (error) {
      console.error('❌ Erreur demande permissions:', error);
    }
  };

  const handleRegisterPushToken = async () => {
    try {
      const { data: token } = await Notifications.getExpoPushTokenAsync({projectId: '10ceb5a1-1bf6-4d94-ae20-ec53efa03beb'});
      const livreurId = await AsyncStorage.getItem('livreurId') || user?.id;

      if (livreurId && token) {
        await dispatch(registerPushToken({
          livreurId: parseInt(livreurId),
          pushToken: token
        }));
        console.log('✅ Token push enregistré via Redux');
      }
    } catch (error) {
      console.error('❌ Erreur enregistrement token:', error);
    }
  };

  const goToCurrentLivraison = () => {
    if (livraison.currentLivraison) {
      router.push(`/livraison/${livraison.currentLivraison.id}`);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadDashboardData();
      await livraison.loadPersistedData();
    } catch (error) {
      console.error('❌ Erreur refresh:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const testNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🧪 Test de notification",
          body: "Ceci est un test pour vérifier que les notifications fonctionnent",
          data: { 
            type: 'TEST',
            commandeId: '123',
            restaurant: 'Test Restaurant',
            clientNom: 'Test Client',
            clientTelephone: '+237 600 000 000',
            adresse: 'Adresse de test',
            prix: '5000',
            platNom: 'Plat de test',
            quantity: '1',
            recommandations: '',
            restaurantLat: '4.0483',
            restaurantLng: '9.7043',
            timestamp: new Date().toISOString()
          }
        },
        trigger: null,
      });
      Alert.alert('Test envoyé', 'Vous devriez recevoir une notification de test');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer la notification de test');
    }
  };

  const clearReduxError = () => {
    dispatch(clearError());
  };

  return (
    <View style={styles.container}>
      {/* Handler de notifications (invisible) */}
      <NotificationHandler />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Image
            source={{ 
              uri: user?.image || 'https://via.placeholder.com/50' 
            }}
            style={styles.profileImage}
          />
          <View style={styles.headerText}>
            <Text style={styles.welcomeText}>Bonjour,</Text>
            <Text style={styles.userName}>
              {user ? `${user.prenom} ${user.username || ''}` : 'Livreur'}
            </Text>
          </View>
          
          {/* Toggle statut en ligne */}
          <View style={styles.statusContainer}>
            <Text style={[styles.statusText, { color: isOnline ? COLORS.success : COLORS.gray }]}>
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </Text>
            <Switch
              value={isOnline} // ✅ Utilisez l'état local synchronisé
              onValueChange={toggleOnlineStatus}
              trackColor={{ false: COLORS.gray, true: COLORS.success }}
              thumbColor={isOnline ? COLORS.success : COLORS.light}
              disabled={loading} // ✅ Utilisez loading de Redux
            />
            
            {/* {__DEV__ && (
              <Text style={{ fontSize: 10, color: 'gray', marginTop: 5 }}>
                Debug: Redux={user?.disponible}, Local={isOnline}, Loading={loading}
              </Text>
            )} */}
          </View>
          
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Erreur Redux */}
        {livraison.error && (
          <TouchableOpacity style={styles.errorAlert} onPress={clearReduxError}>
            <Ionicons name="warning" size={24} color={COLORS.error} />
            <View style={styles.errorContent}>
              <Text style={styles.errorTitle}>Erreur</Text>
              <Text style={styles.errorText}>{livraison.error}</Text>
            </View>
            <Ionicons name="close" size={20} color={COLORS.error} />
          </TouchableOpacity>
        )}

        {/* Livraison en cours */}
        {livraison.currentLivraison && (
          <TouchableOpacity style={styles.currentDeliveryCard} onPress={goToCurrentLivraison}>
            <View style={styles.deliveryHeader}>
              <Text style={styles.deliveryTitle}>🚚 Livraison en cours</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.deliveryText}>
              {livraison.currentLivraison.commande?.plat?.restaurant?.name || 'Restaurant'}
            </Text>
            <Text style={styles.deliverySubtext}>
              Vers: {livraison.currentLivraison.commande?.user?.name || 'Client'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Alerte si hors ligne */}
        <View>
        {!isOnline && (
        <Animated.View 
          style={[
            styles.offlineAlert,
            { opacity: fadeAnim }
          ]}
        >
          <Ionicons name="warning" size={24} color={COLORS.warning} />
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Vous êtes hors ligne</Text>
            <Text style={styles.alertText}>
              Passez en ligne pour recevoir des commandes
            </Text>
          </View>
        </Animated.View>
      )}
        </View>

        {/* Statistiques */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="trophy" size={30} color={COLORS.warning} />
            <Text style={styles.statNumber}>{livraison.stats.totalLivraisons}</Text>
            <Text style={styles.statLabel}>Livraisons</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="star" size={30} color={COLORS.warning} />
            <Text style={styles.statNumber}>{livraison.stats.note}</Text>
            <Text style={styles.statLabel}>Note</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="cash" size={30} color={COLORS.success} />
            <Text style={styles.statNumber}>{livraison.stats.gainsJour} F</Text>
            <Text style={styles.statLabel}>Aujourd'hui</Text>
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/livraisons')}
          >
            <Ionicons name="list" size={24} color={COLORS.primary} />
            <Text style={styles.actionText}>Mes livraisons</Text>
            {commandesDisponibles.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{commandesDisponibles.length}</Text>
          </View>
        )}
        
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/historique')}
          >
            <Ionicons name="time" size={24} color={COLORS.secondary} />
            <Text style={styles.actionText}>Historique</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={testNotification}
          >
            <Ionicons name="notifications" size={24} color={COLORS.warning} />
            <Text style={styles.actionText}>Test notification</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        {/* État Redux */}
        <View style={styles.debugSection}>
          <Text style={styles.sectionTitle}>État du système</Text>
          <View style={styles.debugCard}>
            <View style={styles.debugRow}>
              <Text style={styles.debugLabel}>Redux connecté:</Text>
              <Text style={[styles.debugValue, styles.success]}>✅ Oui</Text>
            </View>
            <View style={styles.debugRow}>
              <Text style={styles.debugLabel}>Notifications:</Text>
              <Text style={[styles.debugValue, notificationsEnabled ? styles.success : styles.error]}>
                {notificationsEnabled ? '✅ Activées' : '❌ Désactivées'}
              </Text>
            </View>
            <View style={styles.debugRow}>
              <Text style={styles.debugLabel}>Token push:</Text>
              <Text style={[styles.debugValue, livraison.pushTokenRegistered ? styles.success : styles.warning]}>
                {livraison.pushTokenRegistered ? '✅ Enregistré' : '⚠️ Non enregistré'}
              </Text>
            </View>
            <View style={styles.debugRow}>
              <Text style={styles.debugLabel}>Backend:</Text>
              <Text style={[styles.debugValue, styles.success]}>✅ http://192.168.1.86:3000</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  headerText: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  currentDeliveryCard: {
    backgroundColor: COLORS.primary + '20',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  deliveryText: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: 'bold',
  },
  deliverySubtext: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  offlineAlert: {
    flexDirection: 'row',
    backgroundColor: COLORS.warning + '20',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  alertContent: {
    marginLeft: 15,
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.warning,
  },
  alertText: {
    fontSize: 14,
    color: COLORS.dark,
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
  },
  quickActions: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 15,
  },
  actionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: COLORS.dark,
  },
  tipsSection: {
    marginBottom: 25,
  },
  tipCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipText: {
    marginLeft: 15,
    fontSize: 14,
    color: COLORS.dark,
    flex: 1,
    lineHeight: 20,
  },
  notificationStatus: {
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
  },
  statusRowText: {
    marginLeft: 15,
    fontSize: 14,
    color: COLORS.dark,
    flex: 1,
  },
  activateButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  activateButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },

  errorAlert: {
    flexDirection: 'row',
    backgroundColor: COLORS.error + '20',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  errorContent: {
    marginLeft: 15,
    flex: 1,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.error,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.dark,
    marginTop: 2,
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 10,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  debugSection: {
    marginBottom: 20,
  },
  debugCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
  },
  debugRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  debugLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  debugValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  success: {
    color: COLORS.success,
  },
  error: {
    color: COLORS.error,
  },
  warning: {
    color: COLORS.warning,
  },
});