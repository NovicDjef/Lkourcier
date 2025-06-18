import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadPersistedState } from '../redux/livraisonSlice';

export const useLivraison = () => {
  const dispatch = useDispatch();
  const livraison = useSelector((state) => state.livraison);
  
  // Charger l'état persisté au démarrage
  useEffect(() => {
    loadPersistedData();
  }, []);
  
  const loadPersistedData = async () => {
    try {
      const [isOnline, currentLivraison, pushTokenRegistered] = await Promise.all([
        AsyncStorage.getItem('isOnline'),
        AsyncStorage.getItem('currentLivraison'),
        AsyncStorage.getItem('pushTokenRegistered'),
      ]);
      
      dispatch(loadPersistedState({
        isOnline: isOnline === 'true',
        currentLivraison: currentLivraison ? JSON.parse(currentLivraison) : null,
        pushTokenRegistered: pushTokenRegistered === 'true',
      }));
    } catch (error) {
      console.error('❌ Erreur chargement données persistées:', error);
    }
  };
  
  return {
    ...livraison,
    loadPersistedData,
  };
};
