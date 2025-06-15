
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const apiService = axios.create({
//   baseURL: 'https://nguetioofa.dev:4040/',
  baseURL: 'http://192.168.1.86:3000',  //chez moi ordinateur local
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json', 
  },

  responseType: 'json',
  withCredentials: true,
});

apiService.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');

      if (token) {
        config.headers.Authorization = `Bearer ${token}`; 
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error); 
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiService;


