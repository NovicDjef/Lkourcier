import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

class PushNotificationService {
  constructor() {
    this.token = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return this.token;

    try {
      // Vérifier si c'est un appareil physique
      if (!Device.isDevice) {
        console.log('Les notifications push nécessitent un appareil physique');
        return null;
      }

      // Vérifier les permissions existantes
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Demander les permissions si nécessaire
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permissions de notification refusées');
        return null;
      }

      // Obtenir le token Expo Push
      this.token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })).data;

      console.log('Token de notification obtenu:', this.token);

      // Configurer le canal Android
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      // Enregistrer le token sur le serveur
      await this.registerTokenOnServer();

      this.initialized = true;
      return this.token;

    } catch (error) {
      console.error('Erreur initialisation notifications:', error);
      return null;
    }
  }

  async setupAndroidChannels() {
    // Canal pour les nouvelles commandes
    await Notifications.setNotificationChannelAsync('new-orders', {
      name: 'Nouvelles commandes',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
      sound: 'notification_sound.wav', // Fichier audio personnalisé
    });

    // Canal pour les mises à jour de livraison
    await Notifications.setNotificationChannelAsync('delivery-updates', {
      name: 'Mises à jour de livraison',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250],
      lightColor: '#FF9800',
    });

    // Canal pour les bonus et récompenses
    await Notifications.setNotificationChannelAsync('rewards', {
      name: 'Bonus et récompenses',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'success_sound.wav',
    });
  }

  async registerTokenOnServer() {
    try {
      const token = await AsyncStorage.getItem('livreurToken');
      const livreurId = await AsyncStorage.getItem('livreurId');

      if (token && this.token) {
        await axios.post(
          'http://your-api-url.com/api/livreur/register-push-token',
          {
            pushToken: this.token,
            livreurId: livreurId,
            platform: Platform.OS,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        console.log('Token enregistré sur le serveur');
      }
    } catch (error) {
      console.error('Erreur enregistrement token serveur:', error);
    }
  }

  async sendLocalNotification({ title, body, data = {}, channelId = 'default' }) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null, // Immédiatement
    });
  }

  async scheduleBadgeUpdate(count) {
    await Notifications.setBadgeCountAsync(count);
  }

  async clearAllNotifications() {
    await Notifications.dismissAllNotificationsAsync();
    await Notifications.setBadgeCountAsync(0);
  }

  getToken() {
    return this.token;
  }
}

export const pushNotificationService = new PushNotificationService();
