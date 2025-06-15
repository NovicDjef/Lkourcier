// services/notifications.js
import Constants from 'expo-constants';
import * as Device from 'expo-device'; // ✅ Utilisez * as Device
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const configureNotifications = async () => {
  try {
    console.log('🔔 Configuration des notifications...');
    
    // Configuration des notifications
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // ✅ Vérification de sécurité pour Device
    const isPhysicalDevice = Device?.isDevice ?? false;
    
    console.log('📱 Device info:', {
      isDevice: isPhysicalDevice,
      platform: Platform.OS,
      hasConstants: !!Constants.expoConfig
    });

    let token = null;
    
    if (isPhysicalDevice) {
      console.log('📱 Appareil physique détecté, demande des permissions...');
      
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        console.log('🔐 Demande de nouvelles permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('❌ Permissions de notification refusées');
        throw new Error('Permissions de notification refusées');
      }

      console.log('✅ Permissions accordées, génération du token...');
      
      try {
        // ✅ Vérification du projectId avec fallback
        const projectId = Constants.expoConfig?.extra?.eas?.projectId 
                         || Constants.manifest?.extra?.eas?.projectId
                         || Constants.manifest2?.extra?.eas?.projectId;
        
        console.log('🆔 Project ID:', projectId);
        
        if (projectId) {
          token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
          console.log('🎯 Token généré:', token.substring(0, 20) + '...');
        } else {
          console.warn('⚠️ Project ID manquant, token non généré');
        }
      } catch (tokenError) {
        console.warn('⚠️ Erreur génération token:', tokenError.message);
        // Ne pas throw, continuer sans token
      }
    } else {
      console.log('🖥️ Émulateur détecté, notifications limitées');
    }

    // Configuration Android
    if (Platform.OS === 'android') {
      console.log('🤖 Configuration Android...');
      await Notifications.setNotificationChannelAsync('commandes', {
        name: 'Nouvelles commandes',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4CAF50',
      });
      console.log('✅ Canal Android configuré');
    }

    console.log('✅ Configuration notifications terminée');
    return token;
    
  } catch (error) {
    console.error('❌ Erreur configuration notifications:', error);
    // ✅ Ne pas faire crash l'app, juste log l'erreur
    return null;
  }
};

export const sendLocalNotification = async (title, body, data = {}) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null, // Immédiatement
    });
    console.log('✅ Notification locale envoyée:', title);
  } catch (error) {
    console.error('❌ Erreur notification locale:', error);
  }
};