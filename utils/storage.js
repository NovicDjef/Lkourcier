// utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  LIVREUR_TOKEN: 'livreurToken',
  LIVREUR_DATA: 'livreurData',
  APP_SETTINGS: 'appSettings',
};

export const storeData = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error('Erreur sauvegarde:', error);
  }
};

export const getData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Erreur récupération:', error);
    return null;
  }
};

export const removeData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Erreur suppression:', error);
  }
};

export const clearAll = async () => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Erreur nettoyage:', error);
  }
};