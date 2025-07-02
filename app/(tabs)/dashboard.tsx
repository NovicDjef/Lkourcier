import NotificationHandler from '@/components/livraison/NotificationHandler';
// import InitialLoader from '@/components/ui/InitialLoader';
import { COLORS } from '@/constants/Colors';
import { useLivraison } from '@/hooks/useLivraison';
import { fetchHistoriqueLivraisons } from '@/redux/livraisonSlice';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { useDispatch, useSelector } from 'react-redux';
const { width: screenWidth } = Dimensions.get('window');

export default function DashboardScreen() {
  const dispatch = useDispatch();
  const livraison = useLivraison();
  
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState('week');
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Redux selectors
  const { user, loading, error } = useSelector(state => state.auth);
  const commandesDisponibles = useSelector(state => state.commande.commandes);
  const livraisonState = useSelector(state => state.livraison);
  const { historiqueLivraisons, historiqueLoading, historiqueError } = livraisonState;

  const [isOnline, setIsOnline] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const loaderAnim = useRef(new Animated.Value(0)).current;
  const livreurId = user?.id;

  console.debug("Dashboard livreurId:", livreurId);
  
  // Fonction pour déterminer le type de livraison
  const getDeliveryType = (livraison) => {
    // Vérifier d'abord le type explicite s'il existe
    if (livraison.type) {
      return livraison.type.toLowerCase().includes('colis') ? 'colis' : 'repas';
    }
    
    // Sinon analyser le contenu
    const restaurant = livraison.commande?.plat?.restaurant?.name || 
                      livraison.commande?.restaurant?.name ||
                      livraison.restaurant?.name || '';
    
    const platNom = livraison.commande?.plat?.nom || 
                   livraison.commande?.platNom || 
                   livraison.platNom || '';
    
    const description = livraison.commande?.description || 
                       livraison.description || '';
    
    const allText = (restaurant + ' ' + platNom + ' ' + description).toLowerCase();
    
    // Mots-clés pour identifier les colis
    const colisKeywords = ['colis', 'package', 'livraison express', 'document', 'courrier', 'pli'];
    const repasKeywords = ['restaurant', 'plat', 'menu', 'food', 'cuisine', 'repas'];
    
    if (colisKeywords.some(keyword => allText.includes(keyword))) {
      return 'colis';
    }
    
    if (repasKeywords.some(keyword => allText.includes(keyword))) {
      return 'repas';
    }
    
    // Par défaut, considérer comme repas si c'est ambigu
    return 'repas';
  };

  const loadHistorique = async (targetLivreurId) => {
    console.log(`📜 === DEBUT loadHistorique Dashboard ===`);
    console.log(`📜 livreurId: ${targetLivreurId}, period: ${filterPeriod}`);
    
    if (!targetLivreurId) {
      console.warn("❌ Pas de livreurId dans loadHistorique");
      return;
    }
    
    try {
      const action = { livreurId: targetLivreurId, period: filterPeriod };
      console.log("📡 Action à dispatcher:", action);
      
      const result = await dispatch(fetchHistoriqueLivraisons(action));
      
      if (fetchHistoriqueLivraisons.fulfilled.match(result)) {
        console.log("✅ loadHistorique Dashboard réussi");
        console.log("✅ Données reçues:", result.payload);
      } else if (fetchHistoriqueLivraisons.rejected.match(result)) {
        console.error("❌ loadHistorique Dashboard échoué:", result.payload);
        console.error("❌ Erreur complète:", result.error);
      } else {
        console.warn("⚠️ Résultat inattendu:", result);
      }
    } catch (error) {
      console.error("❌ Erreur dans loadHistorique Dashboard:", error);
    }
    
    console.log(`📜 === FIN loadHistorique Dashboard ===`);
  };

  useEffect(() => {
    console.log("🔄 useEffect Dashboard déclenché - loadHistorique");
    if (livreurId) {
      loadHistorique(livreurId);
    } else {
      console.log("❌ Pas de livreurId dans useEffect Dashboard");
    }
  }, [livreurId, filterPeriod]);

  useEffect(() => {
    // Animation d'entrée pour le loader
    Animated.loop(
      Animated.sequence([
        Animated.timing(loaderAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(loaderAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animation d'entrée pour les cartes (après le loader)
    const timer = setTimeout(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, 2000);

    return () => clearTimeout(timer);
  }, []); 

  useEffect(() => {
    const checkLoadingComplete = () => {
      const dataReady = user && !historiqueLoading;
      
      setTimeout(() => {
        if (dataReady || (!loading && user?.id)) {
          setInitialLoading(false);
        }
      }, 2000);
    };

    const timer = setTimeout(checkLoadingComplete, 1500);
    
    return () => clearTimeout(timer);
  }, [user, historiqueLoading, loading]);

  const onRefresh = React.useCallback(async () => {
    if (!livreurId) {
      console.warn("❌ Pas de livreurId pour refresh");
      return;
    }
    
    setRefreshing(true);
    
    try {
      await loadHistorique(livreurId);
      await loadDashboardData();
      await livraison.loadPersistedData();
      
      console.log("✅ Refresh Dashboard terminé");
    } catch (error) {
      console.error("❌ Erreur refresh Dashboard:", error);
    } finally {
      setRefreshing(false);
      console.log("🔄 === FIN REFRESH Dashboard ===");
    }
  }, [livreurId, livraison]);

  const loadDashboardData = async () => {
    try {
      const targetLivreurId = user?.id;
      
      if (targetLivreurId) {
        console.log("📊 Chargement données dashboard pour:", targetLivreurId);
      }
    } catch (error) {
      console.error('❌ Erreur chargement données dashboard:', error);
    }
  };

  const calculatedStats = useMemo(() => {
 
  
    if (!historiqueLivraisons || !Array.isArray(historiqueLivraisons) || historiqueLivraisons.length === 0) {
      console.log('📊 Retour des valeurs par défaut');
      return {
        totalLivraisons: 0,
        totalRepas: 0,
        totalColis: 0,
        gainsTotal: 0,
        gainsJour: 0,
        gainsSemaine: 0,
        moyenneTemps: '0 min',
        tauxSucces: '0%',
        dailyEarnings: { 
          labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'], 
          datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }] 
        },
        weeklyDeliveries: { 
          labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'], 
          datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }] 
        },
        dailyRepasDeliveries: { 
          labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'], 
          datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }] 
        },
        dailyColisDeliveries: { 
          labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'], 
          datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }] 
        },
        deliveryTypes: [
          { name: 'Aucune donnée', count: 1, color: '#E0E0E0', legendFontColor: '#7F7F7F' }
        ]
      };
    }
  
    console.log('📊 Début calculs avec', historiqueLivraisons.length, 'livraisons');
  
    const totalLivraisons = historiqueLivraisons.length;
    
    // Comptage par type de livraison
    let totalRepas = 0;
    let totalColis = 0;
    
    historiqueLivraisons.forEach(livraison => {
      const type = getDeliveryType(livraison);
      if (type === 'repas') {
        totalRepas++;
      } else {
        totalColis++;
      }
    });
    
    // Calcul des gains
    let gainsTotal = 0;
    try {
      gainsTotal = historiqueLivraisons.reduce((total, livraison, index) => {
        try {
          const prixCommande = parseFloat(livraison.commande?.prix || livraison.prix || 0);
          const gain = prixCommande * 0.1;
          
          if (index === 0) {
            console.log('📊 Premier élément structure:', {
              livraison: livraison,
              prix: livraison.commande?.prix || livraison.prix,
              prixFloat: prixCommande,
              gain: gain
            });
          }
          
          return total + gain;
        } catch (error) {
          console.error('❌ Erreur calcul gain pour livraison', index, ':', error);
          return total;
        }
      }, 0);
    } catch (error) {
      console.error('❌ Erreur calcul gains total:', error);
      gainsTotal = 0;
    }
  
    // Calcul des gains du jour
    let gainsJour = 0;
    try {
      const aujourdhui = new Date();
      const aujourdhuiStr = aujourdhui.toDateString();
      
      gainsJour = historiqueLivraisons
        .filter(livraison => {
          try {
            const livraisonDate = new Date(livraison.created_at || livraison.createdAt);
            const isSameDay = livraisonDate.toDateString() === aujourdhuiStr;
            
            if (isSameDay) {
              console.log('📊 Livraison du jour trouvée:', livraison);
            }
            
            return isSameDay;
          } catch (error) {
            console.error('❌ Erreur parsing date pour livraison:', livraison);
            return false;
          }
        })
        .reduce((total, livraison) => {
          try {
            const prixCommande = parseFloat(livraison.commande?.prix || livraison.prix || 0);
            return total + (prixCommande * 0.1);
          } catch (error) {
            console.error('❌ Erreur calcul gain jour:', error);
            return total;
          }
        }, 0);
    } catch (error) {
      console.error('❌ Erreur calcul gains jour:', error);
      gainsJour = 0;
    }
  
    // Calcul des gains de la semaine
    let gainsSemaine = 0;
    try {
      const uneSemaineEnArriere = new Date();
      uneSemaineEnArriere.setDate(uneSemaineEnArriere.getDate() - 7);
      console.log('📊 Date semaine en arrière:', uneSemaineEnArriere.toDateString());
      
      gainsSemaine = historiqueLivraisons
        .filter(livraison => {
          try {
            const livraisonDate = new Date(livraison.created_at || livraison.createdAt);
            return livraisonDate >= uneSemaineEnArriere;
          } catch (error) {
            console.error('❌ Erreur parsing date semaine pour livraison:', livraison);
            return false;
          }
        })
        .reduce((total, livraison) => {
          try {
            const prixCommande = parseFloat(livraison.commande?.prix || livraison.prix || 0);
            return total + (prixCommande * 0.1);
          } catch (error) {
            console.error('❌ Erreur calcul gain semaine:', error);
            return total;
          }
        }, 0);
    } catch (error) {
      console.error('❌ Erreur calcul gains semaine:', error);
      gainsSemaine = 0;
    }
  
    // Calcul du temps moyen
    let moyenneTemps = 0;
    try {
      const livraisonsCompletes = historiqueLivraisons.filter(l => 
        l.statut === 'livree' || l.statut === 'livrée' || l.status === 'delivered'
      );
      
      console.log('📊 Livraisons complètes:', livraisonsCompletes.length);
      
      if (livraisonsCompletes.length > 0) {
        const totalTemps = livraisonsCompletes.reduce((total, livraison) => {
          try {
            const debut = new Date(livraison.created_at || livraison.createdAt);
            const fin = new Date(livraison.updated_at || livraison.updatedAt || livraison.created_at);
            const duree = (fin - debut) / (1000 * 60);
            return total + (duree > 0 ? duree : 30);
          } catch (error) {
            console.error('❌ Erreur calcul temps pour livraison:', livraison);
            return total + 30;
          }
        }, 0);
        
        moyenneTemps = Math.round(totalTemps / livraisonsCompletes.length);
      }
    } catch (error) {
      console.error('❌ Erreur calcul temps moyen:', error);
      moyenneTemps = 0;
    }
  
    // Taux de succès
    let tauxSucces = 0;
    try {
      const livraisonsReussies = historiqueLivraisons.filter(l => 
        l.statut === 'livree' || l.statut === 'livrée' || l.status === 'delivered'
      ).length;
      
      tauxSucces = totalLivraisons > 0 ? Math.round((livraisonsReussies / totalLivraisons) * 100) : 0;
    } catch (error) {
      console.error('❌ Erreur calcul taux succès:', error);
      tauxSucces = 0;
    }
  
    // Données graphiques améliorées par jour
    let dailyEarnings, weeklyDeliveries, dailyRepasDeliveries, dailyColisDeliveries;
    try {
      const derniersSeptJours = [];
      const gainsParJour = [];
      const livraisonsParJour = [];
      const repasParJour = [];
      const colisParJour = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toDateString();
        
        const joursLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        derniersSeptJours.push(joursLabels[date.getDay()]);
        
        // Filtrer les livraisons du jour
        const livraisonsJour = historiqueLivraisons.filter(livraison => {
          try {
            return new Date(livraison.created_at || livraison.createdAt).toDateString() === dateStr;
          } catch {
            return false;
          }
        });
        
        // Gains du jour
        const gainsJour = livraisonsJour.reduce((total, livraison) => {
          try {
            const prixCommande = parseFloat(livraison.commande?.prix || livraison.prix || 0);
            return total + (prixCommande * 0.1);
          } catch {
            return total;
          }
        }, 0);
        
        // Comptage par type
        let repasCount = 0;
        let colisCount = 0;
        
        livraisonsJour.forEach(livraison => {
          const type = getDeliveryType(livraison);
          if (type === 'repas') {
            repasCount++;
          } else {
            colisCount++;
          }
        });
        
        gainsParJour.push(Math.round(gainsJour));
        livraisonsParJour.push(livraisonsJour.length);
        repasParJour.push(repasCount);
        colisParJour.push(colisCount);
      }
  
      dailyEarnings = {
        labels: derniersSeptJours,
        datasets: [{
          data: gainsParJour.length > 0 ? gainsParJour : [0, 0, 0, 0, 0, 0, 0],
          color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
          strokeWidth: 3
        }]
      };
  
      weeklyDeliveries = {
        labels: derniersSeptJours,
        datasets: [{
          data: livraisonsParJour.length > 0 ? livraisonsParJour : [0, 0, 0, 0, 0, 0, 0]
        }]
      };
      
      dailyRepasDeliveries = {
        labels: derniersSeptJours,
        datasets: [{
          data: repasParJour.length > 0 ? repasParJour : [0, 0, 0, 0, 0, 0, 0]
        }]
      };
      
      dailyColisDeliveries = {
        labels: derniersSeptJours,
        datasets: [{
          data: colisParJour.length > 0 ? colisParJour : [0, 0, 0, 0, 0, 0, 0]
        }]
      };
    } catch (error) {
      dailyEarnings = { 
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'], 
        datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }] 
      };
      weeklyDeliveries = { 
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'], 
        datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }] 
      };
      dailyRepasDeliveries = { 
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'], 
        datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }] 
      };
      dailyColisDeliveries = { 
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'], 
        datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }] 
      };
    }
  
    // Types de livraisons améliorés
    let deliveryTypes = [];
    try {
      const typesCount = {
        'Livraisons de repas': totalRepas,
        'Livraisons de colis': totalColis
      };
      
      deliveryTypes = Object.entries(typesCount)
        .filter(([type, count]) => count > 0)
        .map(([type, count], index) => {
          const colors = [COLORS.info, COLORS.error, COLORS.warning, COLORS.primary];
          return {
            name: type,
            count,
            color: colors[index % colors.length],
            legendFontColor: '#34495e'
          };
        });
  
      if (deliveryTypes.length === 0) {
        deliveryTypes = [
          { name: 'Aucune donnée', count: 1, color: '#bdc3c7', legendFontColor: '#7f8c8d' }
        ];
      }
    } catch (error) {
      console.error('❌ Erreur calcul types livraisons:', error);
      deliveryTypes = [
        { name: 'Aucune donnée', count: 1, color: '#bdc3c7', legendFontColor: '#7f8c8d' }
      ];
    }
  
    const result = {
      totalLivraisons,
      totalRepas,
      totalColis,
      gainsTotal: Math.round(gainsTotal),
      gainsJour: Math.round(gainsJour),
      gainsSemaine: Math.round(gainsSemaine),
      moyenneTemps: `${moyenneTemps} min`,
      tauxSucces: `${tauxSucces}%`,
      dailyEarnings,
      weeklyDeliveries,
      dailyRepasDeliveries,
      dailyColisDeliveries,
      deliveryTypes
    };
  
    return result;
  }, [historiqueLivraisons]);

  useEffect(() => {
    if (user && user.disponible !== undefined) {
      console.warn('📱 Synchronisation statut utilisateur:', user.disponible);
      setIsOnline(user.disponible);

      
    }
  }, [user?.disponible]);

  useEffect(() => {
    if (user?.disponible !== undefined) {
      const newOnlineStatus = user.disponible;
      
      if (newOnlineStatus !== isOnline) {
        Animated.timing(fadeAnim, {
          toValue: newOnlineStatus ? 0 : 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [user?.disponible, isOnline]);

   useEffect(() => {
    if (livraison.isOnline && user?.id) {
      loadDashboardData();
    }
  }, [livraison.isOnline, user?.id]);

  useEffect(() => {
    initializeDashboard();
    checkNotificationPermissions();
    console.log("commandesDisponibles :", commandesDisponibles);
  }, []);

  const initializeDashboard = async () => {
    try {
      console.log('📱 Dashboard initialisé');
    } catch (error) {
      console.error('❌ Erreur initialisation dashboard:', error);
    }
  };

  const checkNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationsEnabled(status === 'granted');
    } catch (error) {
      console.error('❌ Erreur vérification permissions:', error);
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      const newStatus = !isOnline;
      const livreurId = user?.id;
      
      if (!livreurId) {
        Alert.alert('Erreur', 'Identifiant livreur manquant');
        return;
      }

      if (newStatus && !notificationsEnabled) {
        Alert.alert(
          'Notifications requises',
          'Vous devez activer les notifications pour recevoir les commandes.',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Activer', onPress: () => requestNotificationPermissions() }
          ]
        );
        return;
      }

      console.log('🔄 Changement statut:', { livreurId, newStatus });
      setIsOnline(newStatus);

 
      // const result = await dispatch(updateLivreurStatus({
      //   livreurId: parseInt(livreurId),
      //   disponible: newStatus
      // }));

      // if (updateLivreurStatus.fulfilled.match(result)) {
      //   console.log('✅ Statut mis à jour avec succès');
        
      //   if (newStatus) {
      //     await handleRegisterPushToken();
      //   }

      //   Alert.alert(
      //     'Statut mis à jour',
      //     `Vous êtes maintenant ${newStatus ? 'en ligne' : 'hors ligne'}${newStatus ? ' et prêt à recevoir des commandes' : ''}`
      //   );

      //   if (newStatus) {
      //     loadDashboardData();
      //   }
      // } else {
      //   console.error('❌ Erreur mise à jour:', result.payload);
      //   setIsOnline(!newStatus);
      //   Alert.alert('Erreur', result.payload || 'Impossible de mettre à jour votre statut');
      // }
    } catch (error) {
      console.error('❌ Erreur changement statut:', error);
      setIsOnline(!newStatus);
      Alert.alert('Erreur', 'Impossible de mettre à jour votre statut');
    }
  };

  const requestNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationsEnabled(status === 'granted');
      
      if (status === 'granted') {
        await handleRegisterPushToken();
        Alert.alert('Notifications activées', 'Vous pouvez maintenant passer en ligne');
      } else {
        Alert.alert(
          'Permissions refusées',
          'Vous ne pourrez pas recevoir de notifications de commandes'
        );
      }
    } catch (error) {
      console.error('❌ Erreur demande permissions:', error);
    }
  };

  const handleRegisterPushToken = async () => {
    try {
      const { data: token } = await Notifications.getExpoPushTokenAsync({projectId: '10ceb5a1-1bf6-4d94-ae20-ec53efa03beb'});
      const livreurId = await AsyncStorage.getItem('livreurId') || user?.id;

      if (livreurId && token) {
        await dispatch(registerPushToken({
          livreurId: parseInt(livreurId),
          pushToken: token
        }));
        console.log('✅ Token push enregistré via Redux');
      }
    } catch (error) {
      console.error('❌ Erreur enregistrement token:', error);
    }
  };

  const goToCurrentLivraison = () => {
    if (livraison.currentLivraison) {
      router.push(`/livraison/${livraison.currentLivraison.id}`);
    }
  };

  const testNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🧪 Test de notification",
          body: "Ceci est un test pour vérifier que les notifications fonctionnent",
          data: { 
            type: 'TEST',
            commandeId: '123',
            restaurant: 'Test Restaurant',
            clientNom: 'Test Client',
            clientTelephone: '+237 600 000 000',
            adresse: 'Adresse de test',
            prix: '5000',
            platNom: 'Plat de test',
            quantity: '1',
            recommandations: '',
            restaurantLat: '4.0483',
            restaurantLng: '9.7043',
            timestamp: new Date().toISOString()
          }
        },
        trigger: null,
      });
      Alert.alert('Test envoyé', 'Vous devriez recevoir une notification de test');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer la notification de test');
    }
  };

  const clearReduxError = () => {
    dispatch(clearError());
  };

  const StatCard = ({ icon, value, label, color, trend }) => {
    const cardScale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(cardScale, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(cardScale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    const safeValue = value !== undefined && value !== null ? value : '0';
    const safeLabel = label || 'Label';
    const safeTrend = trend !== undefined && trend !== null ? trend : 0;

    return (
      <Animated.View style={[styles.modernStatCard, { transform: [{ scale: cardScale }] }]}>
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon} size={24} color={color} />
          </View>
          <Text style={styles.statValue}>{safeValue}</Text>
          <Text style={styles.statLabel}>{safeLabel}</Text>
          {safeTrend !== 0 && (
            <View style={styles.trendContainer}>
              <Ionicons 
                name={safeTrend > 0 ? 'trending-up' : 'trending-down'} 
                size={12} 
                color={safeTrend > 0 ? COLORS.primary : COLORS.error} 
              />
              <Text style={[styles.trendText, { color: safeTrend > 0 ? COLORS.primary : COLORS.error }]}>
                {Math.abs(safeTrend)}%
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(52, 73, 94, ${opacity * 0.8})`,
    style: { borderRadius: 16 },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: COLORS.info
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: '#ecf0f1',
      strokeWidth: 1
    },
    propsForLabels: {
      fontSize: 12
    }
  };

  const barChartConfig = {
    ...chartConfig,
    fillShadowGradient: COLORS.info,
    fillShadowGradientOpacity: 0.8,
  };

  const repasChartConfig = {
    ...chartConfig,
    color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`,
    fillShadowGradient: COLORS.error,
    fillShadowGradientOpacity: 0.8,
  };

  const colisChartConfig = {
    ...chartConfig,
    color: (opacity = 1) => `rgba(243, 156, 18, ${opacity})`,
    fillShadowGradient: COLORS.warning,
    fillShadowGradientOpacity: 0.8,
  };

  return (
    <View style={styles.container}>
      <NotificationHandler />

      {/* Header classique et élégant */}
      <View style={styles.classicHeader}>
        <View style={styles.headerContent}>
          <View style={styles.profileSection}>
            <Image source={require('../../assets/avatar/21.avif')}
              style={styles.classicProfileImage}
            />
            <View style={styles.headerText}>
              <Text style={styles.welcomeText}>Bonjour,</Text>
              <Text style={styles.userName}>
                {user ? `${user.prenom} ${user.username || ''}` : 'Livreur'}
              </Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={14} color={COLORS.warning} />
                <Text style={styles.ratingText}>
                  {livraison.stats?.note || '0.0'}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Toggle statut élégant */}
          <View style={styles.classicStatusContainer}>
            <View style={[styles.statusIndicator, { backgroundColor: isOnline ? COLORS.primary : '#95a5a6' }]} />
            <Text style={[styles.statusText, { color: isOnline ? COLORS.primary : '#95a5a6' }]}>
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </Text>
            <Switch
              value={isOnline}
              onValueChange={toggleOnlineStatus}
              trackColor={{ false: '#ecf0f1', true: COLORS.primary + '40' }}
              thumbColor={isOnline ? COLORS.primary : '#95a5a6'}
              disabled={loading}
              style={styles.classicSwitch}
            />
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Erreur Redux */}
        {(livraison.error || historiqueError) && (
          <TouchableOpacity style={styles.errorAlert} onPress={clearReduxError}>
            <Ionicons name="warning" size={24} color={COLORS.error} />
            <View style={styles.errorContent}>
              <Text style={styles.errorTitle}>Erreur</Text>
              <Text style={styles.errorText}>
                {livraison.error || historiqueError || 'Erreur de chargement des données'}
              </Text>
            </View>
            <Ionicons name="close" size={20} color={COLORS.error} />
          </TouchableOpacity>
        )}

        {/* Livraison en cours */}
        {livraison.currentLivraison && (
          <Animated.View style={[styles.classicDeliveryCard, { transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity onPress={goToCurrentLivraison} style={styles.deliveryCardContent}>
              <View style={styles.deliveryHeader}>
                <View style={styles.deliveryIconContainer}>
                  <Ionicons name="bicycle" size={24} color="#ffffff" />
                </View>
                <View style={styles.deliveryInfo}>
                  <Text style={styles.deliveryTitle}>🚚 Livraison en cours</Text>
                  <Text style={styles.deliverySubtitle}>
                    {livraison.currentLivraison.commande?.plat?.restaurant?.name || 'Restaurant'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.info} />
              </View>
              <View style={styles.deliveryProgress}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '60%' }]} />
                </View>
                <Text style={styles.progressText}>En route vers le client</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Alerte hors ligne */}
        {!isOnline && (
          <Animated.View style={[styles.classicOfflineAlert, { opacity: 1 }]}>
            <Ionicons name="wifi-outline" size={24} color={COLORS.warning} />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Vous êtes hors ligne</Text>
              <Text style={styles.alertText}>Passez en ligne pour recevoir des commandes</Text>
            </View>
          </Animated.View>
        )}

        {/* Statistiques avec types de livraisons */}
        <Animated.View style={[styles.classicStatsContainer, { transform: [{ scale: scaleAnim }] }]}>
          <StatCard
            icon="restaurant"
            value={calculatedStats.totalRepas || 0}
            label="Livraisons repas"
            color={COLORS.error}
            trend={calculatedStats.totalRepas > 0 ? 8 : 0}
          />
          <StatCard
            icon="cube"
            value={calculatedStats.totalColis || 0}
            label="Livraisons colis"
            color="#9b59b6"
            trend={calculatedStats.totalColis > 0 ? 5 : 0}
          />
        </Animated.View>

        {/* Résumé des gains */}
        <View style={styles.classicEarningsCard}>
          <View style={styles.earningsHeader}>
            <Ionicons name="wallet" size={24} color={COLORS.primary} />
            <Text style={styles.earningsTitle}>Résumé des gains</Text>
          </View>
          <View style={styles.earningsGrid}>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsLabel}>Total</Text>
              <Text style={styles.earningsValue}>
                {(calculatedStats.gainsTotal || 0).toLocaleString()} F
              </Text>
            </View>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsLabel}>Cette semaine</Text>
              <Text style={styles.earningsValue}>
                {(calculatedStats.gainsSemaine || 0).toLocaleString()} F
              </Text>
            </View>
          </View>
          <Text style={styles.commissionNote}>* Commission de 10% par livraison</Text>
        </View>

        {/* Actions rapides */}
        <View style={styles.classicQuickActions}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.classicActionCard, { backgroundColor: COLORS.info + '15' }]}
              onPress={() => router.push('/(tabs)/livraisons')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: COLORS.info }]}>
                <Ionicons name="list" size={20} color="#ffffff" />
              </View>
              <Text style={styles.classicActionText}>Mes livraisons</Text>
              {commandesDisponibles.length > 0 && (
                <View style={styles.classicBadge}>
                  <Text style={styles.badgeText}>{commandesDisponibles.length}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* <TouchableOpacity
              style={[styles.classicActionCard, { backgroundColor: COLORS.error + '15' }]}
              onPress={() => router.push('/(tabs)/historique')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: COLORS.error }]}>
                <Ionicons name="time" size={20} color="#ffffff" />
              </View>
              <Text style={styles.classicActionText}>Historique</Text>
            </TouchableOpacity> */}

            {/* <TouchableOpacity
              style={[styles.classicActionCard, { backgroundColor: COLORS.warning + '15' }]}
              onPress={testNotification}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: COLORS.warning }]}>
                <Ionicons name="notifications" size={20} color="#ffffff" />
              </View>
              <Text style={styles.classicActionText}>Test notification</Text>
            </TouchableOpacity> */}

            <TouchableOpacity
              style={[styles.classicActionCard, { backgroundColor: COLORS.primary + '15' }]}
              onPress={() => router.push('../../components/revenu/EarningsScreen')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: COLORS.primary }]}>
                <Ionicons name="analytics" size={20} color="#ffffff" />
              </View>
              <Text style={styles.classicActionText}>Revenus</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Graphiques améliorée */}
        <View style={styles.chartsSection}>
          {/* Graphique des gains journaliers */}
          <View style={styles.classicChartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>💰 Gains de la semaine</Text>
              <TouchableOpacity>
                <Text style={styles.totalGains}>
                  Total: {(calculatedStats.gainsSemaine || 0).toLocaleString()} F
                </Text>
              </TouchableOpacity>
            </View>
            {historiqueLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Chargement des données...</Text>
              </View>
            ) : (
              <LineChart
                data={calculatedStats.dailyEarnings}
                width={screenWidth - 60}
                height={200}
                chartConfig={chartConfig}
                style={styles.chart}
                bezier
                withInnerLines={true}
                withOuterLines={false}
                withVerticalLines={false}
                withHorizontalLines={true}
              />
            )}
          </View>

          {/* Graphiques séparés pour repas et colis */}
          <View style={styles.classicChartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>🍽️ Livraisons de repas par jour</Text>
              <TouchableOpacity>
                <Text style={styles.totalDeliveries}>
                  Total: {calculatedStats.totalRepas || 0}
                </Text>
              </TouchableOpacity>
            </View>
            {historiqueLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Chargement des données...</Text>
              </View>
            ) : (
              <BarChart
                data={calculatedStats.dailyRepasDeliveries}
                width={screenWidth - 60}
                height={200}
                chartConfig={repasChartConfig}
                style={styles.chart}
                showValuesOnTopOfBars={true}
                withInnerLines={false}
              />
            )}
          </View>

          <View style={styles.classicChartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>📦 Livraisons de colis par jour</Text>
              <TouchableOpacity>
                <Text style={styles.totalDeliveries}>
                  Total: {calculatedStats.totalColis || 0}
                </Text>
              </TouchableOpacity>
            </View>
            {historiqueLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Chargement des données...</Text>
              </View>
            ) : (
              <BarChart
                data={calculatedStats.dailyColisDeliveries}
                width={screenWidth - 60}
                height={200}
                chartConfig={colisChartConfig}
                style={styles.chart}
                showValuesOnTopOfBars={true}
                withInnerLines={false}
              />
            )}
          </View>

          {/* Graphique circulaire des types de livraisons */}
          <View style={styles.classicChartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>📊 Répartition des livraisons</Text>
              <TouchableOpacity>
                <Ionicons name="pie-chart" size={20} color={COLORS.info} />
              </TouchableOpacity>
            </View>
            {historiqueLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Chargement des données...</Text>
              </View>
            ) : calculatedStats.deliveryTypes.length > 0 && calculatedStats.deliveryTypes[0].name !== 'Aucune donnée' ? (
              <PieChart
                data={calculatedStats.deliveryTypes}
                width={screenWidth - 60}
                height={200}
                chartConfig={chartConfig}
                accessor="count"
                backgroundColor="transparent"
                paddingLeft="15"
                style={styles.chart}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Ionicons name="analytics-outline" size={48} color="#95a5a6" />
                <Text style={styles.noDataText}>Aucune livraison pour le moment</Text>
                <Text style={styles.noDataSubtext}>Commencez à livrer pour voir vos statistiques</Text>
              </View>
            )}
          </View>
        </View>

        {/* État du système */}
        {/* <View style={styles.systemStatus}>
          <Text style={styles.sectionTitle}>État du système</Text>
          <View style={styles.classicDebugCard}>
            <View style={styles.statusItem}>
              <View style={styles.statusItemLeft}>
                <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
                <Text style={styles.statusLabel}>Redux connecté</Text>
              </View>
              <Text style={[styles.statusValue, { color: '#27ae60' }]}>✅ Actif</Text>
            </View>

            <View style={styles.statusItem}>
              <View style={styles.statusItemLeft}>
                <Ionicons 
                  name={notificationsEnabled ? "notifications" : "notifications-off"} 
                  size={20} 
                  color={notificationsEnabled ? '#27ae60' : '#e74c3c'} 
                />
                <Text style={styles.statusLabel}>Notifications</Text>
              </View>
              <Text style={[styles.statusValue, { color: notificationsEnabled ? '#27ae60' : '#e74c3c' }]}>
                {notificationsEnabled ? '✅ Activées' : '❌ Désactivées'}
              </Text>
            </View>

            <View style={styles.statusItem}>
              <View style={styles.statusItemLeft}>
                <Ionicons 
                  name={livraison.pushTokenRegistered ? "shield-checkmark" : "shield"} 
                  size={20} 
                  color={livraison.pushTokenRegistered ? '#27ae60' : '#f39c12'} 
                />
                <Text style={styles.statusLabel}>Token push</Text>
              </View>
              <Text style={[styles.statusValue, { color: livraison.pushTokenRegistered ? '#27ae60' : '#f39c12' }]}>
                {livraison.pushTokenRegistered ? '✅ Enregistré' : '⚠️ En attente'}
              </Text>
            </View>

            <View style={styles.statusItem}>
              <View style={styles.statusItemLeft}>
                <Ionicons 
                  name={historiqueLoading ? "hourglass" : "server"} 
                  size={20} 
                  color={historiqueLoading ? '#f39c12' : '#27ae60'} 
                />
                <Text style={styles.statusLabel}>Historique des livraisons</Text>
              </View>
              <Text style={[styles.statusValue, { color: historiqueLoading ? '#f39c12' : '#27ae60' }]}>
                {historiqueLoading ? '⏳ Chargement...' : `✅ ${historiqueLivraisons?.length || 0} livraisons`}
              </Text>
            </View>

            <View style={styles.statusItem}>
              <View style={styles.statusItemLeft}>
                <Ionicons name="server" size={20} color="#27ae60" />
                <Text style={styles.statusLabel}>Serveur</Text>
              </View>
              <Text style={[styles.statusValue, { color: '#27ae60' }]}>✅ En ligne</Text>
            </View>
          </View>
        </View> */}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  // Nouveau style de header classique et élégant
  classicHeader: {
    backgroundColor: '#ffffff',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  classicProfileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 2,
    borderColor: COLORS.primary + 80,
  },
  headerText: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#34495e',
    marginLeft: 4,
    fontWeight: '600',
  },
  classicStatusContainer: {
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  classicSwitch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
  
  content: {
    flex: 1,
    padding: 20,
  },
  
  // Cards avec style classique
  classicDeliveryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  deliveryCardContent: {
    padding: 20,
  },
  deliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  deliveryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.info,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
  },
  deliverySubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  deliveryProgress: {
    marginTop: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#ecf0f1',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.info,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 8,
    textAlign: 'center',
  },
  
  classicOfflineAlert: {
    flexDirection: 'row',
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  alertContent: {
    marginLeft: 15,
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#856404',
  },
  alertText: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  
  classicStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modernStatCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    width: (screenWidth - 60) / 2,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  
  classicEarningsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  earningsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginLeft: 10,
  },
  earningsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  earningsItem: {
    flex: 1,
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 5,
    fontWeight: '500',
  },
  earningsValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  commissionNote: {
    fontSize: 11,
    color: '#95a5a6',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  
  classicQuickActions: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  classicActionCard: {
    width: (screenWidth - 55) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  classicActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  },
  classicBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  
  chartsSection: {
    marginBottom: 25,
  },
  classicChartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
  },
  chart: {
    borderRadius: 12,
    marginLeft: -15,
  },
  totalGains: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  totalDeliveries: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.error,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  noDataContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#95a5a6',
    marginTop: 15,
    textAlign: 'center',
  },
  noDataSubtext: {
    fontSize: 12,
    color: '#bdc3c7',
    marginTop: 5,
    textAlign: 'center',
  },
  
  systemStatus: {
    marginBottom: 25,
  },
  classicDebugCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  statusItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#2c3e50',
    marginLeft: 12,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  errorAlert: {
    flexDirection: 'row',
    backgroundColor: '#f8d7da',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
    borderWidth: 1,
    borderColor: '#f1aeb5',
  },
  errorContent: {
    marginLeft: 15,
    flex: 1,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#721c24',
  },
  errorText: {
    fontSize: 12,
    color: '#856404',
    marginTop: 2,
  },
  
  bottomSpacing: {
    height: 20,
  },
});