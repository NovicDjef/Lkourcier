import { COLORS } from '@/constants/Colors';
import {
  acceptCommande,
  hideCommandeModal,
  rejectCommande,
  showCommandeModal,
} from '@/redux/livraisonSlice';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Alert, Animated, Modal, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';



export const NotificationHandler = () => {
  const dispatch = useDispatch();
  const { showNotificationModal, pendingCommande, loading } = useSelector(
    (state) => state.livraison
  );
  
  const [timeLeft, setTimeLeft] = React.useState(30);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const countdownRef = useRef(null);

  useEffect(() => {
    setupNotificationListeners();
    return cleanup;
  }, []);

  useEffect(() => {
    if (showNotificationModal && pendingCommande) {
      setTimeLeft(30);
      startCountdown();
      startPulseAnimation();
    } else {
      cleanup();
    }
  }, [showNotificationModal, pendingCommande]);

  const setupNotificationListeners = () => {
    // Écouter les notifications reçues
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📱 Notification reçue:', notification);
        handleNotificationReceived(notification);
      }
    );

    // Écouter les réponses aux notifications
    const responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('📱 Réponse notification:', response);
        handleNotificationReceived(response.notification);
      }
    );

    return { notificationListener, responseListener };
  };

  const cleanup = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const handleNotificationReceived = (notification) => {
    const { data } = notification.request.content;
    
    if (data?.type === 'NEW_COMMANDE') {
      console.log('🔔 Nouvelle commande reçue:', data);
      
      // Préparer les données de la commande pour Redux
      const commandeData = {
        id: data.commandeId,
        restaurant: data.restaurant,
        clientNom: data.clientNom,
        clientTelephone: data.clientTelephone,
        adresse: data.adresse,
        prix: data.prix,
        platNom: data.platNom,
        quantity: data.quantity,
        recommandations: data.recommandations,
        restaurantLat: parseFloat(data.restaurantLat),
        restaurantLng: parseFloat(data.restaurantLng),
        timestamp: data.timestamp,
      };

      // Afficher la modal via Redux
      dispatch(showCommandeModal(commandeData));
    }
  };

  const startCountdown = () => {
    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          handleReject(); // Auto-refus
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startPulseAnimation = () => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
  };

  const handleAccept = async () => {
    if (!pendingCommande || loading) return;

    try {
      const livreurId = await AsyncStorage.getItem('livreurId');
      
      if (!livreurId) {
        Alert.alert('Erreur', 'Identifiant livreur manquant');
        return;
      }

      // Utiliser Redux pour accepter la commande
      const result = await dispatch(acceptCommande({
        commandeId: pendingCommande.id,
        livreurId: parseInt(livreurId)
      }));

      if (acceptCommande.fulfilled.match(result)) {
        console.log('✅ Commande acceptée via Redux');
        
        // Naviguer vers l'écran de livraison
        router.push(`/livraison/${result.payload.id}`);
        
        Alert.alert(
          '✅ Commande acceptée',
          'Vous pouvez maintenant vous diriger vers le restaurant.'
        );
      } else {
        // Gestion d'erreur
        const errorMessage = result.payload || 'Erreur lors de l\'acceptation';
        Alert.alert('Erreur', errorMessage);
      }
    } catch (error) {
      console.error('❌ Erreur acceptation:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  const handleReject = async () => {
    if (!pendingCommande) return;

    try {
      const livreurId = await AsyncStorage.getItem('livreurId');
      
      if (livreurId) {
        // Utiliser Redux pour refuser la commande
        await dispatch(rejectCommande({
          commandeId: pendingCommande.id,
          livreurId: parseInt(livreurId)
        }));
      }
      
      // Fermer la modal
      dispatch(hideCommandeModal());
      
    } catch (error) {
      console.error('❌ Erreur refus:', error);
      dispatch(hideCommandeModal());
    }
  };

  if (!showNotificationModal || !pendingCommande) return null;

  return (
    <Modal
      visible={showNotificationModal}
      transparent
      animationType="slide"
      onRequestClose={handleReject}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.modal,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          {/* Header avec countdown */}
          <View style={styles.header}>
            <Text style={styles.title}>🚚 Nouvelle Commande !</Text>
            <View style={styles.countdownContainer}>
              <Text style={styles.countdown}>{timeLeft}s</Text>
            </View>
          </View>

          {/* Détails de la commande */}
          <View style={styles.details}>
            <View style={styles.infoRow}>
              <Ionicons name="restaurant" size={20} color={COLORS.secondary} />
              <Text style={styles.infoText}>{pendingCommande.restaurant}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>{pendingCommande.clientNom}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>{pendingCommande.clientTelephone}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color={COLORS.gray} />
              <Text style={styles.infoText} numberOfLines={2}>
                {pendingCommande.adresse}
              </Text>
            </View>

            <View style={styles.orderDetails}>
              <Text style={styles.orderTitle}>Commande:</Text>
              <Text style={styles.orderText}>
                {pendingCommande.quantity}x {pendingCommande.platNom}
              </Text>
              {pendingCommande.recommandations && (
                <Text style={styles.recommendations}>
                  Note: {pendingCommande.recommandations}
                </Text>
              )}
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Montant:</Text>
              <Text style={styles.price}>{pendingCommande.prix} FCFA</Text>
            </View>
          </View>

          {/* Boutons d'action */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.rejectButton} 
              onPress={handleReject}
              disabled={loading}
            >
              <Text style={styles.rejectText}>❌ Refuser</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.acceptButton, loading && styles.buttonDisabled]} 
              onPress={handleAccept}
              disabled={loading}
            >
              <Text style={styles.acceptText}>
                {loading ? '⏳ Chargement...' : '✅ Accepter'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};