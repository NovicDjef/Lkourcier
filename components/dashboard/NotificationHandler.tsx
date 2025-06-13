// components/dashboard/NotificationHandler.js
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useDispatch } from 'react-redux';

export const NotificationHandler = (): null => {
  const dispatch = useDispatch();
  const appState = useRef(AppState.currentState);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Configurer le handler de notifications
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const { data } = notification.request.content;
        
        // Log pour debug
        console.log('Notification reçue:', notification);
        
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        };
      },
    });

    // Écouter les notifications reçues
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        handleNotificationReceived(notification);
      }
    );

    // Écouter les réponses aux notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        handleNotificationResponse(response);
      }
    );

    // Écouter les changements d'état de l'app
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App revient au premier plan
        handleAppForeground();
      }
      appState.current = nextAppState;
    });

    return () => {
      notificationListener.current && 
        Notifications.removeNotificationSubscription(notificationListener.current);
      responseListener.current && 
        Notifications.removeNotificationSubscription(responseListener.current);
      subscription?.remove();
    };
  }, []);

  const handleNotificationReceived = (notification) => {
    const { data } = notification.request.content;
    
    switch (data?.type) {
      case 'NEW_COMMANDE':
        // Gérer nouvelle commande
        dispatch(fetchPendingCommandes());
        break;
      case 'COMMANDE_CANCELLED':
        // Commande annulée
        dispatch(fetchActiveLivraisons());
        break;
      case 'BONUS_EARNED':
        // Bonus gagné
        dispatch(fetchLivreurStats());
        break;
      default:
        console.log('Type de notification non géré:', data?.type);
    }
  };

  const handleNotificationResponse = (response) => {
    const { data } = response.notification.request.content;
    
    // Navigation basée sur le type de notification
    switch (data?.type) {
      case 'NEW_COMMANDE':
        if (data.commandeId) {
          router.push(`/livraison/${data.commandeId}`);
        } else {
          router.push('/(tabs)/dashboard');
        }
        break;
      case 'LIVRAISON_UPDATE':
        router.push('/(tabs)/livraisons');
        break;
      default:
        router.push('/(tabs)/dashboard');
    }
  };

  const handleAppForeground = () => {
    // Rafraîchir les données quand l'app revient au premier plan
    dispatch(fetchLivreurStats());
    dispatch(fetchActiveLivraisons());
  };

  return null; // Ce composant ne rend rien
};

