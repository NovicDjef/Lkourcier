// app/(tabs)/dashboard.js
import { COLORS } from '@/constants/Colors';
import {
  acceptCommande,
  fetchLivreurStats,
  fetchPendingCommandes,
  rejectCommande,
  updateLivreurStatus,
} from '@/redux/livraisonSlice';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

const DashboardScreen = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { stats, pendingCommandes, isOnline } = useSelector(
    (state) => state.livraison
  );

  const [refreshing, setRefreshing] = useState(false);
  const [newCommandeModal, setNewCommandeModal] = useState(false);
  const [currentCommande, setCurrentCommande] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30); // 30 secondes pour accepter
  
  const notificationListener = useRef();
  const responseListener = useRef();
  const animatedValue = useRef(new Animated.Value(0)).current;
  const countdownInterval = useRef(null);

  useEffect(() => {
    initializeApp();
    setupNotifications();
    
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
  }, []);

  const initializeApp = async () => {
    // Charger les statistiques et commandes en attente
    dispatch(fetchLivreurStats());
    dispatch(fetchPendingCommandes());
    
    // Demander permissions de localisation
    await requestLocationPermission();
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        'La localisation est nécessaire pour recevoir des commandes.'
      );
      return;
    }

    // Démarrer le suivi de localisation
    startLocationTracking();
  };

  const startLocationTracking = async () => {
    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // 10 secondes
          distanceInterval: 50, // 50 mètres
        },
        (location) => {
          dispatch(updateLivreurLocation(location.coords));
        }
      );
    } catch (error) {
      console.error('Erreur tracking localisation:', error);
    }
  };

  const setupNotifications = async () => {
    // Configuration des notifications
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // Écouter les notifications reçues
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        const { data } = notification.request.content;
        if (data?.type === 'NEW_COMMANDE') {
          handleNewCommandeNotification(data);
        }
      }
    );

    // Écouter les réponses aux notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const { data } = response.notification.request.content;
        if (data?.commandeId) {
          router.push(`/livraison/${data.commandeId}`);
        }
      }
    );
  };

  const handleNewCommandeNotification = (data) => {
    const commande = {
      id: data.commandeId,
      restaurant: data.restaurant,
      client: data.client,
      distance: data.distance,
      prix: data.prix,
      adresse: data.adresse,
    };

    setCurrentCommande(commande);
    setTimeLeft(30);
    setNewCommandeModal(true);
    
    // Animation d'attention
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Countdown
    countdownInterval.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleRejectCommande(); // Auto-refus
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAcceptCommande = async () => {
    if (!currentCommande) return;

    try {
      const result = await dispatch(acceptCommande(currentCommande.id));
      
      if (acceptCommande.fulfilled.match(result)) {
        closeCommandeModal();
        router.push(`/livraison/${currentCommande.id}`);
      } else {
        Alert.alert('Erreur', 'Impossible d\'accepter la commande');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  const handleRejectCommande = async () => {
    if (!currentCommande) return;

    await dispatch(rejectCommande(currentCommande.id));
    closeCommandeModal();
  };

  const closeCommandeModal = () => {
    setNewCommandeModal(false);
    setCurrentCommande(null);
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }
    animatedValue.stopAnimation();
  };

  const toggleOnlineStatus = async () => {
    const newStatus = !isOnline;
    dispatch(updateLivreurStatus(newStatus));
    
    if (newStatus) {
      await startLocationTracking();
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Promise.all([
      dispatch(fetchLivreurStats()),
      dispatch(fetchPendingCommandes()),
    ]).finally(() => setRefreshing(false));
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Image
            source={{ uri: user?.photo || 'https://via.placeholder.com/50' }}
            style={styles.profileImage}
          />
          <View style={styles.headerText}>
            <Text style={styles.welcomeText}>Bonjour,</Text>
            <Text style={styles.userName}>{user?.prenom} {user?.nom}</Text>
          </View>
          <TouchableOpacity
            style={[styles.statusButton, isOnline ? styles.online : styles.offline]}
            onPress={toggleOnlineStatus}
          >
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Statistiques */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="trophy" size={30} color={COLORS.warning} />
            <Text style={styles.statNumber}>{stats?.totalLivraisons || 0}</Text>
            <Text style={styles.statLabel}>Livraisons</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="star" size={30} color={COLORS.warning} />
            <Text style={styles.statNumber}>{stats?.note || '5.0'}</Text>
            <Text style={styles.statLabel}>Note</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="cash" size={30} color={COLORS.success} />
            <Text style={styles.statNumber}>{stats?.gainsJour || '0'} F</Text>
            <Text style={styles.statLabel}>Aujourd'hui</Text>
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/livraisons')}
          >
            <Ionicons name="list" size={24} color={COLORS.primary} />
            <Text style={styles.actionText}>Mes livraisons</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/historique')}
          >
            <Ionicons name="time" size={24} color={COLORS.secondary} />
            <Text style={styles.actionText}>Historique</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/profil')}
          >
            <Ionicons name="person" size={24} color={COLORS.primary} />
            <Text style={styles.actionText}>Mon profil</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        {/* État du jour */}
        <View style={styles.todaySection}>
          <Text style={styles.sectionTitle}>Aujourd'hui</Text>
          <View style={styles.todayCard}>
            <Text style={styles.todayText}>
              {isOnline ? 
                'Vous êtes en ligne et prêt à recevoir des commandes!' : 
                'Passez en ligne pour recevoir des commandes'
              }
            </Text>
            {!isOnline && (
              <TouchableOpacity
                style={styles.goOnlineButton}
                onPress={toggleOnlineStatus}
              >
                <Text style={styles.goOnlineText}>Passer en ligne</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modal Nouvelle Commande */}
      <Modal
        visible={newCommandeModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{
                  scale: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.05],
                  }),
                }],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Ionicons name="notifications" size={40} color={COLORS.warning} />
              <Text style={styles.modalTitle}>Nouvelle Commande!</Text>
              <Text style={styles.countdown}>{timeLeft}s</Text>
            </View>

            {currentCommande && (
              <View style={styles.commandeDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="restaurant" size={20} color={COLORS.primary} />
                  <Text style={styles.detailText}>{currentCommande.restaurant}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="location" size={20} color={COLORS.secondary} />
                  <Text style={styles.detailText}>{currentCommande.adresse}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="car" size={20} color={COLORS.gray} />
                  <Text style={styles.detailText}>{currentCommande.distance}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="cash" size={20} color={COLORS.success} />
                  <Text style={styles.detailText}>{currentCommande.prix} FCFA</Text>
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={handleRejectCommande}
              >
                <Text style={styles.rejectText}>Refuser</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={handleAcceptCommande}
              >
                <Text style={styles.acceptText}>Accepter</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

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
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  online: {
    backgroundColor: COLORS.success + '20',
  },
  offline: {
    backgroundColor: COLORS.gray + '20',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  content: {
    flex: 1,
    padding: 20,
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
  todaySection: {
    marginBottom: 20,
  },
  todayCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  todayText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 15,
  },
  goOnlineButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  goOnlineText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 25,
    margin: 20,
    width: '90%',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginVertical: 10,
  },
  countdown: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.error,
  },
  commandeDetails: {
    marginBottom: 25,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailText: {
    marginLeft: 10,
    fontSize: 14,
    color: COLORS.dark,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rejectButton: {
    backgroundColor: COLORS.error,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  acceptButton: {
    backgroundColor: COLORS.success,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  rejectText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  acceptText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});

export default DashboardScreen;