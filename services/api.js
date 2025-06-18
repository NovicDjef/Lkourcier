
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const apiService = axios.create({
  // baseURL: 'https://nguetioofa.dev:4040/',
  baseURL: 'http://192.168.1.86:3000',  //chez moi ordinateur local
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  responseType: 'json',
  withCredentials: true,
});

// Intercepteur pour ajouter le token automatiquement
apiService.interceptors.request.use(
  async (config) => {
    try {
      // Essayer d'abord avec le token livreur, puis le token utilisateur
      let token = await AsyncStorage.getItem('livreurToken');
      if (!token) {
        token = await AsyncStorage.getItem('userToken');
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Log pour debug
      console.log(`📡 ${config.method.toUpperCase()} ${config.url}`);
      
    } catch (error) {
      console.error('❌ Erreur récupération token:', error);
    }
    return config;
  },
  (error) => {
    console.error('❌ Erreur intercepteur request:', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses et erreurs
apiService.interceptors.response.use(
  (response) => {
    // Log succès
    console.log(`✅ ${response.config.method.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  async (error) => {
    const { config, response } = error;
    
    // Log erreur
    console.error(`❌ ${config?.method?.toUpperCase()} ${config?.url} - ${response?.status}:`, 
                  response?.data?.message || error.message);
    
    // Si erreur 401 (non autorisé), nettoyer les tokens
    if (response?.status === 401) {
      await AsyncStorage.multiRemove(['livreurToken', 'userToken', 'livreurData']);
      // Ici vous pourriez rediriger vers login si nécessaire
    }
    
    // Si erreur réseau, afficher un message plus explicite
    if (!response) {
      error.message = 'Erreur de connexion. Vérifiez votre connexion internet.';
    }
    
    return Promise.reject(error);
  }
);

export default apiService;
