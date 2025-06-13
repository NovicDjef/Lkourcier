// services/backgroundTasks.js
import * as BackgroundFetch from 'expo-background-fetch';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const LOCATION_TASK_NAME = 'background-location-task';
const DATA_SYNC_TASK_NAME = 'background-data-sync';

// Tâche de géolocalisation en arrière-plan
TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error) {
    console.error('Erreur tâche géolocalisation:', error);
    return;
  }

  if (data) {
    const { locations } = data;
    const location = locations[0];
    
    if (location) {
      // Envoyer la position au serveur
      updateLocationOnServer(location.coords);
    }
  }
});

// Tâche de synchronisation des données
TaskManager.defineTask(DATA_SYNC_TASK_NAME, async () => {
  try {
    console.log('Synchronisation des données en arrière-plan');
    
    const token = await AsyncStorage.getItem('livreurToken');
    if (!token) return BackgroundFetch.BackgroundFetchResult.Failed;

    // Synchroniser les données critiques
    await syncCriticalData(token);
    
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Erreur sync arrière-plan:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

const updateLocationOnServer = async (coords) => {
  try {
    const token = await AsyncStorage.getItem('livreurToken');
    if (!token) return;

    await axios.put(
      'http://your-api-url.com/api/livreur/location',
      {
        latitude: coords.latitude,
        longitude: coords.longitude,
        timestamp: new Date().toISOString(),
      },
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000, // 10 secondes timeout
      }
    );
  } catch (error) {
    console.error('Erreur mise à jour position:', error);
  }
};

const syncCriticalData = async (token) => {
  // Synchroniser les livraisons actives
  const activeLivraisons = await axios.get(
    'http://your-api-url.com/api/livraisons/active',
    { headers: { Authorization: `Bearer ${token}` } }
  );

  // Sauvegarder localement pour accès hors ligne
  await AsyncStorage.setItem(
    'cachedActiveLivraisons',
    JSON.stringify(activeLivraisons.data)
  );

  // Synchroniser les statistiques
  const stats = await axios.get(
    'http://your-api-url.com/api/livreur/stats',
    { headers: { Authorization: `Bearer ${token}` } }
  );

  await AsyncStorage.setItem(
    'cachedStats',
    JSON.stringify(stats.data)
  );
};

export const BackgroundTaskService = {
  async startLocationTracking() {
    try {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission géolocalisation arrière-plan refusée');
        return false;
      }

      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 30000, // 30 secondes
        distanceInterval: 100, // 100 mètres
        foregroundService: {
          notificationTitle: 'Suivi de localisation actif',
          notificationBody: 'Votre position est suivie pour les livraisons',
          notificationColor: '#4CAF50',
        },
      });

      console.log('Suivi de localisation démarré');
      return true;
    } catch (error) {
      console.error('Erreur démarrage suivi localisation:', error);
      return false;
    }
  },

  async stopLocationTracking() {
    try {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      console.log('Suivi de localisation arrêté');
    } catch (error) {
      console.error('Erreur arrêt suivi localisation:', error);
    }
  },

  async registerBackgroundSync() {
    try {
      await BackgroundFetch.registerTaskAsync(DATA_SYNC_TASK_NAME, {
        minimumInterval: 15 * 60, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });
      
      console.log('Synchronisation arrière-plan enregistrée');
    } catch (error) {
      console.error('Erreur enregistrement sync arrière-plan:', error);
    }
  },

  async unregisterBackgroundSync() {
    await BackgroundFetch.unregisterTaskAsync(DATA_SYNC_TASK_NAME);
  },
};