// hooks/useAuth.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const router = useRouter();

  // Vérifier si le token est expiré
  const isTokenExpired = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Erreur décodage token:', error);
      return true; // Considérer comme expiré si erreur
    }
  };

  // Vérifier l'authentification au démarrage
  const checkAuthStatus = async () => {
    try {
      console.log('🔍 Vérification de l\'authentification...');
      
      const token = await AsyncStorage.getItem('livreurToken');
      const userDataString = await AsyncStorage.getItem('livreurData');
      
      if (token && userDataString) {
        // Vérifier si le token n'est pas expiré
        if (!isTokenExpired(token)) {
          const user = JSON.parse(userDataString);
          setUserData(user);
          setIsAuthenticated(true);
          console.log('✅ Utilisateur déjà connecté:', user.username);
          return true;
        } else {
          console.log('⏰ Token expiré, déconnexion...');
          await logout();
        }
      } else {
        console.log('❌ Aucun token trouvé');
      }
      
      return false;
    } catch (error) {
      console.error('Erreur vérification auth:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Connexion
  const login = async (token, user) => {
    try {
      await AsyncStorage.setItem('livreurToken', token);
      await AsyncStorage.setItem('livreurData', JSON.stringify(user));
      setUserData(user);
      setIsAuthenticated(true);
      console.log('✅ Connexion réussie pour:', user.username);
    } catch (error) {
      console.error('Erreur sauvegarde login:', error);
    }
  };

  // Déconnexion
  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['livreurToken', 'livreurData']);
      setUserData(null);
      setIsAuthenticated(false);
      console.log('✅ Déconnexion réussie');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return {
    isLoading,
    isAuthenticated,
    userData,
    login,
    logout,
    checkAuthStatus
  };
};