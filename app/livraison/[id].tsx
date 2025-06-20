// import { COLORS } from '@/constants/Colors';
// import {
//   fetchLivraisonDetails,
//   updateLivraisonStatus,
//   updateLivreurPosition,
// } from '@/redux/livraisonSlice';
// import { Ionicons } from '@expo/vector-icons';
// import axios from 'axios';
// import * as Location from 'expo-location';
// import { router, useLocalSearchParams } from 'expo-router';
// import React, { useEffect, useRef, useState } from 'react';
// import {
//   Alert,
//   Animated,
//   Linking,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View
// } from 'react-native';
// import MapView, { Marker, Polyline } from 'react-native-maps';
// import { useDispatch, useSelector } from 'react-redux';

// const LivraisonScreen = () => {
//   const { id } = useLocalSearchParams();
//   const dispatch = useDispatch();
//   const { currentLivraison } = useSelector((state) => state.livraison);

//   const [region, setRegion] = useState({
//     latitude: 4.0483,
//     longitude: 9.7043,
//     latitudeDelta: 0.01,
//     longitudeDelta: 0.01,
//   });

//   const [livreurPosition, setLivreurPosition] = useState(null);
//   const [restaurantPosition, setRestaurantPosition] = useState(null);
//   const [clientPosition, setClientPosition] = useState(null);
//   const [routeCoordinates, setRouteCoordinates] = useState([]);
//   const [currentStep, setCurrentStep] = useState('EN_ROUTE_RESTAURANT'); // EN_ROUTE_RESTAURANT | EN_ROUTE_CLIENT | LIVRE
//   const [distance, setDistance] = useState('');
//   const [duration, setDuration] = useState('');

//   const mapRef = useRef(null);
//   const locationSubscription = useRef(null);
//   const slideAnim = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     initializeLivraison();
//     startLocationTracking();

//     return () => {
//       if (locationSubscription.current) {
//         locationSubscription.current.remove();
//       }
//     };
//   }, []);

//   const initializeLivraison = async () => {
//     // Charger les détails de la livraison
//     const result = await dispatch(fetchLivraisonDetails(id));
    
//     if (fetchLivraisonDetails.fulfilled.match(result)) {
//       const livraison = result.payload;
      
//       // Configurer les positions
//       setRestaurantPosition({
//         latitude: livraison.restaurant.latitude,
//         longitude: livraison.restaurant.longitude,
//       });

//       // Parser la position client (format: "lat,lng" ou adresse)
//       if (livraison.commande.position.includes(',')) {
//         const [lat, lng] = livraison.commande.position.split(',');
//         setClientPosition({
//           latitude: parseFloat(lat),
//           longitude: parseFloat(lng),
//         });
//       } else {
//         // Géocoder l'adresse
//         await geocodeAddress(livraison.commande.position);
//       }

//       // Déterminer l'étape actuelle
//       if (livraison.status === 'ASSIGNEE') {
//         setCurrentStep('EN_ROUTE_RESTAURANT');
//       } else if (livraison.status === 'EN_COURS') {
//         setCurrentStep('EN_ROUTE_CLIENT');
//       }
//     }
//   };

//   const geocodeAddress = async (address) => {
//     try {
//       const response = await axios.get(
//         `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=YOUR_GOOGLE_MAPS_API_KEY`
//       );
      
//       if (response.data.results.length > 0) {
//         const location = response.data.results[0].geometry.location;
//         setClientPosition({
//           latitude: location.lat,
//           longitude: location.lng,
//         });
//       }
//     } catch (error) {
//       console.error('Erreur géocodage:', error);
//     }
//   };

//   const startLocationTracking = async () => {
//     try {
//       locationSubscription.current = await Location.watchPositionAsync(
//         {
//           accuracy: Location.Accuracy.High,
//           timeInterval: 5000, // 5 secondes
//           distanceInterval: 10, // 10 mètres
//         },
//         (location) => {
//           const newPosition = {
//             latitude: location.coords.latitude,
//             longitude: location.coords.longitude,
//           };
          
//           setLivreurPosition(newPosition);
//           dispatch(updateLivreurPosition(newPosition));
          
//           // Calculer la route vers la destination appropriée
//           if (currentStep === 'EN_ROUTE_RESTAURANT' && restaurantPosition) {
//             calculateRoute(newPosition, restaurantPosition);
//           } else if (currentStep === 'EN_ROUTE_CLIENT' && clientPosition) {
//             calculateRoute(newPosition, clientPosition);
//           }
          
//           // Centrer la carte sur la position du livreur
//           setRegion(prev => ({
//             ...prev,
//             latitude: newPosition.latitude,
//             longitude: newPosition.longitude,
//           }));
//         }
//       );
//     } catch (error) {
//       console.error('Erreur tracking position:', error);
//     }
//   };

//   const calculateRoute = async (start, end) => {
//     try {
//       const response = await axios.get(
//         `https://maps.googleapis.com/maps/api/directions/json?origin=${start.latitude},${start.longitude}&destination=${end.latitude},${end.longitude}&key=YOUR_GOOGLE_MAPS_API_KEY`
//       );

//       if (response.data.routes.length > 0) {
//         const route = response.data.routes[0];
//         const points = decodePolyline(route.overview_polyline.points);
//         setRouteCoordinates(points);
        
//         // Extraire distance et durée
//         const leg = route.legs[0];
//         setDistance(leg.distance.text);
//         setDuration(leg.duration.text);
//       }
//     } catch (error) {
//       console.error('Erreur calcul route:', error);
//     }
//   };

//   const decodePolyline = (encoded) => {
//     const poly = [];
//     let index = 0, len = encoded.length;
//     let lat = 0, lng = 0;

//     while (index < len) {
//       let b, shift = 0, result = 0;
//       do {
//         b = encoded.charCodeAt(index++) - 63;
//         result |= (b & 0x1f) << shift;
//         shift += 5;
//       } while (b >= 0x20);
      
//       lat += ((result & 1) ? ~(result >> 1) : (result >> 1));
      
//       shift = 0;
//       result = 0;
      
//       do {
//         b = encoded.charCodeAt(index++) - 63;
//         result |= (b & 0x1f) << shift;
//         shift += 5;
//       } while (b >= 0x20);
      
//       lng += ((result & 1) ? ~(result >> 1) : (result >> 1));
      
//       poly.push({
//         latitude: lat * 1e-5,
//         longitude: lng * 1e-5
//       });
//     }
//     return poly;
//   };

//   const handleArrivedAtRestaurant = () => {
//     Alert.alert(
//       'Arrivé au restaurant',
//       'Confirmez-vous être arrivé au restaurant et avoir récupéré la commande ?',
//       [
//         { text: 'Annuler', style: 'cancel' },
//         {
//           text: 'Confirmer',
//           onPress: () => {
//             setCurrentStep('EN_ROUTE_CLIENT');
//             dispatch(updateLivraisonStatus({ id, status: 'EN_COURS' }));
            
//             // Animer le changement d'état
//             Animated.spring(slideAnim, {
//               toValue: 1,
//               useNativeDriver: true,
//             }).start();
//           },
//         },
//       ]
//     );
//   };

//   const handleDeliveryCompleted = () => {
//     Alert.alert(
//       'Livraison terminée',
//       'Confirmez-vous avoir livré la commande au client ?',
//       [
//         { text: 'Annuler', style: 'cancel' },
//         {
//           text: 'Confirmer',
//           onPress: async () => {
//             setCurrentStep('LIVRE');
//             await dispatch(updateLivraisonStatus({ id, status: 'LIVREE' }));
            
//             Alert.alert(
//               'Félicitations !',
//               'Livraison terminée avec succès',
//               [{ text: 'OK', onPress: () => router.back() }]
//             );
//           },
//         },
//       ]
//     );
//   };

//   const handleCallClient = () => {
//     if (currentLivraison?.commande?.user?.telephone) {
//       Linking.openURL(`tel:${currentLivraison.commande.user.telephone}`);
//     }
//   };

//   const openGoogleMaps = () => {
//     const destination = currentStep === 'EN_ROUTE_RESTAURANT' ? restaurantPosition : clientPosition;
//     if (destination) {
//       const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}&travelmode=driving`;
//       Linking.openURL(url);
//     }
//   };

//   if (!currentLivraison) {
//     return (
//       <View style={styles.loadingContainer}>
//         <Text>Chargement...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {/* Carte (70% de l'écran) */}
//       <View style={styles.mapContainer}>
//         <MapView
//           ref={mapRef}
//           style={styles.map}
//           region={region}
//           showsUserLocation={true}
//           showsMyLocationButton={false}
//           customMapStyle={mapStyle}
//         >
//           {/* Marqueur livreur */}
//           {livreurPosition && (
//             <Marker coordinate={livreurPosition} title="Vous">
//               <View style={styles.livreurMarker}>
//                 <Ionicons name="bicycle" size={24} color="white" />
//               </View>
//             </Marker>
//           )}

//           {/* Marqueur restaurant */}
//           {restaurantPosition && (
//             <Marker
//               coordinate={restaurantPosition}
//               title="Restaurant"
//               pinColor={currentStep === 'EN_ROUTE_RESTAURANT' ? 'red' : 'gray'}
//             >
//               <View style={[
//                 styles.restaurantMarker,
//                 currentStep === 'EN_ROUTE_RESTAURANT' && styles.activeMarker
//               ]}>
//                 <Ionicons name="restaurant" size={20} color="white" />
//               </View>
//             </Marker>
//           )}

//           {/* Marqueur client */}
//           {clientPosition && (
//             <Marker
//               coordinate={clientPosition}
//               title="Client"
//               pinColor={currentStep === 'EN_ROUTE_CLIENT' ? 'green' : 'gray'}
//             >
//               <View style={[
//                 styles.clientMarker,
//                 currentStep === 'EN_ROUTE_CLIENT' && styles.activeMarker
//               ]}>
//                 <Ionicons name="person" size={20} color="white" />
//               </View>
//             </Marker>
//           )}

//           {/* Route */}
//           {routeCoordinates.length > 0 && (
//             <Polyline
//               coordinates={routeCoordinates}
//               strokeColor={COLORS.primary}
//               strokeWidth={4}
//             />
//           )}
//         </MapView>

//         {/* Boutons overlay sur la carte */}
//         <View style={styles.mapOverlay}>
//           <TouchableOpacity 
//             style={styles.backButton}
//             onPress={() => router.back()}
//           >
//             <Ionicons name="arrow-back" size={24} color="white" />
//           </TouchableOpacity>

//           <TouchableOpacity 
//             style={styles.googleMapsButton}
//             onPress={openGoogleMaps}
//           >
//             <Ionicons name="navigate" size={24} color="white" />
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* Panneau d'informations (30% de l'écran) */}
//       <Animated.View 
//         style={[
//           styles.infoPanel,
//           {
//             transform: [{
//               translateY: slideAnim.interpolate({
//                 inputRange: [0, 1],
//                 outputRange: [0, -10],
//               }),
//             }],
//           },
//         ]}
//       >
//         {/* En-tête avec étape actuelle */}
//         <View style={styles.stepHeader}>
//           <View style={styles.stepIndicator}>
//             <Ionicons 
//               name={
//                 currentStep === 'EN_ROUTE_RESTAURANT' ? 'restaurant' :
//                 currentStep === 'EN_ROUTE_CLIENT' ? 'car' : 'checkmark-circle'
//               }
//               size={24} 
//               color={COLORS.primary} 
//             />
//           </View>
//           <Text style={styles.stepText}>
//             {currentStep === 'EN_ROUTE_RESTAURANT' ? 'Direction restaurant' :
//              currentStep === 'EN_ROUTE_CLIENT' ? 'Direction client' : 'Livraison terminée'}
//           </Text>
//         </View>

//         {/* Informations de navigation */}
//         {(distance || duration) && (
//           <View style={styles.navigationInfo}>
//             <View style={styles.navItem}>
//               <Ionicons name="location" size={16} color={COLORS.gray} />
//               <Text style={styles.navText}>{distance}</Text>
//             </View>
//             <View style={styles.navItem}>
//               <Ionicons name="time" size={16} color={COLORS.gray} />
//               <Text style={styles.navText}>{duration}</Text>
//             </View>
//           </View>
//         )}

//         {/* Détails de la commande */}
//         <View style={styles.commandeInfo}>
//           <Text style={styles.infoTitle}>Détails de la commande</Text>
          
//           <View style={styles.infoRow}>
//             <Text style={styles.infoLabel}>Client:</Text>
//             <Text style={styles.infoValue}>
//               {currentLivraison.commande.user.name}
//             </Text>
//           </View>
          
//           <View style={styles.infoRow}>
//             <Text style={styles.infoLabel}>Téléphone:</Text>
//             <TouchableOpacity onPress={handleCallClient}>
//               <Text style={[styles.infoValue, styles.phoneNumber]}>
//                 {currentLivraison.commande.user.telephone}
//               </Text>
//             </TouchableOpacity>
//           </View>
          
//           <View style={styles.infoRow}>
//             <Text style={styles.infoLabel}>Adresse:</Text>
//             <Text style={styles.infoValue}>
//               {currentLivraison.commande.position}
//             </Text>
//           </View>
          
//           <View style={styles.infoRow}>
//             <Text style={styles.infoLabel}>Montant:</Text>
//             <Text style={[styles.infoValue, styles.amount]}>
//               {currentLivraison.commande.prix} FCFA
//             </Text>
//           </View>
//         </View>

//         {/* Boutons d'action */}
//         <View style={styles.actionButtons}>
//           {currentStep === 'EN_ROUTE_RESTAURANT' && (
//             <TouchableOpacity
//               style={styles.primaryButton}
//               onPress={handleArrivedAtRestaurant}
//             >
//               <Text style={styles.buttonText}>Arrivé au restaurant</Text>
//             </TouchableOpacity>
//           )}
          
//           {currentStep === 'EN_ROUTE_CLIENT' && (
//             <TouchableOpacity
//               style={styles.primaryButton}
//               onPress={handleDeliveryCompleted}
//             >
//               <Text style={styles.buttonText}>Livraison terminée</Text>
//             </TouchableOpacity>
//           )}

//           <TouchableOpacity
//             style={styles.secondaryButton}
//             onPress={handleCallClient}
//           >
//             <Ionicons name="call" size={20} color={COLORS.primary} />
//             <Text style={styles.secondaryButtonText}>Appeler client</Text>
//           </TouchableOpacity>
//         </View>
//       </Animated.View>
//     </View>
//   );
// };

// const mapStyle = [
//   {
//     elementType: 'geometry',
//     stylers: [{ color: '#f5f5f5' }],
//   },
//   {
//     elementType: 'labels.icon',
//     stylers: [{ visibility: 'off' }],
//   },
//   {
//     featureType: 'road',
//     elementType: 'geometry',
//     stylers: [{ color: '#ffffff' }],
//   },
//   {
//     featureType: 'water',
//     elementType: 'geometry',
//     stylers: [{ color: '#c9c9c9' }],
//   },
// ];

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.white,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   mapContainer: {
//     flex: 0.7, // 70% de l'écran
//     position: 'relative',
//   },
//   map: {
//     flex: 1,
//   },
//   mapOverlay: {
//     position: 'absolute',
//     top: 50,
//     left: 20,
//     right: 20,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   backButton: {
//     width: 45,
//     height: 45,
//     borderRadius: 22.5,
//     backgroundColor: COLORS.dark + 'CC',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   googleMapsButton: {
//     width: 45,
//     height: 45,
//     borderRadius: 22.5,
//     backgroundColor: COLORS.primary + 'CC',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   infoPanel: {
//     flex: 0.3, // 30% de l'écran
//     backgroundColor: COLORS.white,
//     borderTopLeftRadius: 25,
//     borderTopRightRadius: 25,
//     padding: 20,
//     marginTop: -20,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   stepHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 15,
//   },
//   stepIndicator: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: COLORS.primary + '20',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 15,
//   },
//   stepText: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: COLORS.dark,
//   },
//   navigationInfo: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     marginBottom: 20,
//     backgroundColor: COLORS.light,
//     borderRadius: 10,
//     padding: 10,
//   },
//   navItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   navText: {
//     marginLeft: 5,
//     fontSize: 14,
//     color: COLORS.gray,
//   },
//   commandeInfo: {
//     marginBottom: 20,
//   },
//   infoTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: COLORS.dark,
//     marginBottom: 10,
//   },
//   infoRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 8,
//   },
//   infoLabel: {
//     fontSize: 14,
//     color: COLORS.gray,
//   },
//   infoValue: {
//     fontSize: 14,
//     color: COLORS.dark,
//     fontWeight: '500',
//   },
//   phoneNumber: {
//     color: COLORS.primary,
//     textDecorationLine: 'underline',
//   },
//   amount: {
//     color: COLORS.success,
//     fontWeight: 'bold',
//   },
//   actionButtons: {
//     gap: 10,
//   },
//   primaryButton: {
//     backgroundColor: COLORS.primary,
//     borderRadius: 12,
//     padding: 15,
//     alignItems: 'center',
//   },
//   buttonText: {
//     color: COLORS.white,
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   secondaryButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: COLORS.primary + '20',
//     borderRadius: 12,
//     padding: 15,
//   },
//   secondaryButtonText: {
//     color: COLORS.primary,
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginLeft: 8,
//   },
//   // Marqueurs personnalisés
//   livreurMarker: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: COLORS.primary,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 3,
//     borderColor: 'white',
//   },
//   restaurantMarker: {
//     width: 35,
//     height: 35,
//     borderRadius: 17.5,
//     backgroundColor: COLORS.secondary,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 2,
//     borderColor: 'white',
//   },
//   clientMarker: {
//     width: 35,
//     height: 35,
//     borderRadius: 17.5,
//     backgroundColor: COLORS.error,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 2,
//     borderColor: 'white',
//   },
//   activeMarker: {
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 5,
//   },
// });

// export default LivraisonScreen;


// app/livraison/[id].js
import { COLORS } from '@/constants/Colors';
import apiService from '@/services/api';
import { getSomeCommandeLivraison } from '@/services/routeApi';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';



const DeliveryScreen = () => {
  const { id } = useLocalSearchParams();
  const [livraison, setLivraison] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [region, setRegion] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [step, setStep] = useState('RESTAURANT'); // RESTAURANT | CLIENT | DELIVERED
  
  const mapRef = useRef(null);
  const locationSubscription = useRef(null);

  useEffect(() => {
    loadLivraisonDetails();
    // getCommandeLivraisonAsync();
    startLocationTracking();
    
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  const loadLivraisonDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('livreurToken');
      const response = await getSomeCommandeLivraison(id);

      if (response.data.success) {
        setLivraison(response.data.livraison);
        setupMapRegion(response.data.livraison);
      }
    } catch (error) {
      console.error('❌ Erreur chargement livraison:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails de la livraison');
    }
  };

  const setupMapRegion = (livraisonData) => {
    const restaurant = livraisonData.commande.plat.restaurant;
    
    setRegion({
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'La localisation est nécessaire pour la navigation');
        return;
      }

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // 5 secondes
          distanceInterval: 10, // 10 mètres
        },
        (location) => {
          const newPosition = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          
          setCurrentPosition(newPosition);
          updateLivreurPosition(newPosition);
          
          if (livraison) {
            calculateRoute(newPosition);
          }
        }
      );
    } catch (error) {
      console.error('❌ Erreur géolocalisation:', error);
    }
  };

  const updateLivreurPosition = async (position) => {
    try {
      const livreurId = await AsyncStorage.getItem('livreurId');
      const token = await AsyncStorage.getItem('livreurToken');

      await axios.put(
        `${apiService}/commandes/livreur/location`,
        {
          livreurId: parseInt(livreurId),
          latitude: position.latitude,
          longitude: position.longitude
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('❌ Erreur mise à jour position:', error);
    }
  };

  const calculateRoute = async (currentPos) => {
    if (!livraison || !currentPos) return;

    const destination = step === 'RESTAURANT' 
      ? {
          latitude: livraison.commande.plat.restaurant.latitude,
          longitude: livraison.commande.plat.restaurant.longitude
        }
      : getClientCoordinates();

    if (!destination) return;

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${currentPos.latitude},${currentPos.longitude}&destination=${destination.latitude},${destination.longitude}&key=YOUR_GOOGLE_MAPS_API_KEY`
      );
      
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const points = decodePolyline(route.overview_polyline.points);
        setRouteCoordinates(points);
        
        const leg = route.legs[0];
        setDistance(leg.distance.text);
        setDuration(leg.duration.text);
      }
    } catch (error) {
      console.error('❌ Erreur calcul route:', error);
    }
  };

  const getClientCoordinates = () => {
    if (!livraison) return null;
    
    const position = livraison.commande.position;
    
    // Si position contient des coordonnées (format: "lat,lng")
    if (position.includes(',')) {
      const [lat, lng] = position.split(',');
      return {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng)
      };
    }
    
    // Sinon, retourner null (géocodage nécessaire)
    return null;
  };

  const decodePolyline = (encoded) => {
    const poly = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      
      lat += ((result & 1) ? ~(result >> 1) : (result >> 1));
      
      shift = 0;
      result = 0;
      
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      
      lng += ((result & 1) ? ~(result >> 1) : (result >> 1));
      
      poly.push({
        latitude: lat * 1e-5,
        longitude: lng * 1e-5
      });
    }
    return poly;
  };

  const handleArrivedAtRestaurant = () => {
    Alert.alert(
      'Arrivé au restaurant',
      'Confirmez-vous avoir récupéré la commande ?',
      [
        { text: 'Pas encore', style: 'cancel' },
        {
          text: 'Récupérée',
          onPress: () => {
            setStep('CLIENT');
            Alert.alert('Direction client', 'Vous pouvez maintenant vous diriger vers le client');
          }
        }
      ]
    );
  };

  const handleDelivered = async () => {
    Alert.alert(
      'Confirmer la livraison',
      'Avez-vous remis la commande au client ?',
      [
        { text: 'Pas encore', style: 'cancel' },
        {
          text: 'Oui, livrée',
          onPress: async () => {
            try {
              const livreurId = await AsyncStorage.getItem('livreurId');
              const token = await AsyncStorage.getItem('livreurToken');

              const response = await axios.post(
                `${apiService}/commandes/delivered`,
                {
                  livraisonId: parseInt(id),
                  livreurId: parseInt(livreurId)
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              if (response.data.success) {
                Alert.alert(
                  '🎉 Félicitations !',
                  'Livraison terminée avec succès',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Nettoyer les données locales
                        AsyncStorage.removeItem('currentLivraison');
                        router.replace('/(tabs)/dashboard');
                      }
                    }
                  ]
                );
              }
            } catch (error) {
              console.error('❌ Erreur confirmation livraison:', error);
              Alert.alert('Erreur', 'Impossible de confirmer la livraison');
            }
          }
        }
      ]
    );
  };

  const handleCallClient = () => {
    if (livraison?.commande?.telephone) {
      Linking.openURL(`tel:${livraison.commande.telephone}`);
    }
  };

  const openGoogleMaps = () => {
    const destination = step === 'RESTAURANT' 
      ? livraison.commande.plat.restaurant
      : getClientCoordinates();

    if (destination) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}&travelmode=driving`;
      Linking.openURL(url);
    }
  };

  if (!livraison) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Chargement des détails...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Carte (70% de l'écran) */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={region}
          showsUserLocation={true}
          followsUserLocation={true}
        >
          {/* Marqueur restaurant */}
          <Marker
            coordinate={{
              latitude: livraison.commande.plat.restaurant.latitude,
              longitude: livraison.commande.plat.restaurant.longitude
            }}
            title="Restaurant"
            description={livraison.commande.plat.restaurant.name}
          >
            <View style={[styles.marker, styles.restaurantMarker]}>
              <Ionicons name="restaurant" size={20} color="white" />
            </View>
          </Marker>

          {/* Marqueur client */}
          {getClientCoordinates() && (
            <Marker
              coordinate={getClientCoordinates()}
              title="Client"
              description={livraison.commande.user.name}
            >
              <View style={[styles.marker, styles.clientMarker]}>
                <Ionicons name="person" size={20} color="white" />
              </View>
            </Marker>
          )}

          {/* Route */}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={COLORS.primary}
              strokeWidth={4}
            />
          )}
        </MapView>

        {/* Boutons overlay */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.mapsButton}
          onPress={openGoogleMaps}
        >
          <Ionicons name="navigate" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Panneau d'informations (30% de l'écran) */}
      <ScrollView style={styles.infoPanel}>
        {/* En-tête avec étape */}
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>
            {step === 'RESTAURANT' ? '🏪 Direction Restaurant' : '🏠 Direction Client'}
          </Text>
          {(distance || duration) && (
            <Text style={styles.stepSubtitle}>{distance} • {duration}</Text>
          )}
        </View>

        {/* Informations commande */}
        <View style={styles.orderInfo}>
          <Text style={styles.sectionTitle}>Détails de la commande</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Restaurant:</Text>
            <Text style={styles.value}>{livraison.commande.plat.restaurant.name}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Client:</Text>
            <Text style={styles.value}>{livraison.commande.user.name}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Téléphone:</Text>
            <TouchableOpacity onPress={handleCallClient}>
              <Text style={[styles.value, styles.phoneNumber]}>
                {livraison.commande.telephone}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Adresse:</Text>
            <Text style={styles.value}>{livraison.commande.position}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Commande:</Text>
            <Text style={styles.value}>
              {livraison.commande.quantity}x {livraison.commande.plat.name}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Montant:</Text>
            <Text style={[styles.value, styles.amount]}>
              {livraison.commande.prix} FCFA
            </Text>
          </View>

          {livraison.commande.recommandation && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Note:</Text>
              <Text style={styles.value}>{livraison.commande.recommandation}</Text>
            </View>
          )}
        </View>

        {/* Boutons d'action */}
        <View style={styles.actionButtons}>
          {step === 'RESTAURANT' && (
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleArrivedAtRestaurant}
            >
              <Text style={styles.buttonText}>✅ Commande récupérée</Text>
            </TouchableOpacity>
          )}
          
          {step === 'CLIENT' && (
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleDelivered}
            >
              <Text style={styles.buttonText}>🏁 Marquer comme livrée</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleCallClient}
          >
            <Ionicons name="call" size={20} color={COLORS.primary} />
            <Text style={styles.secondaryButtonText}>Appeler le client</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    flex: 0.7,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapsButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  marker: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  restaurantMarker: {
    backgroundColor: COLORS.secondary,
  },
  clientMarker: {
    backgroundColor: COLORS.primary,
  },
  infoPanel: {
    flex: 0.3,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    marginTop: -20,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 5,
  },
  stepSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
  },
  orderInfo: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 14,
    color: COLORS.gray,
    flex: 0.4,
  },
  value: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: '500',
    flex: 0.6,
    textAlign: 'right',
  },
  phoneNumber: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  amount: {
    color: COLORS.success,
    fontWeight: 'bold',
  },
  actionButtons: {
    gap: 10,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '20',
    borderRadius: 12,
    padding: 15,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Modal styles (du NotificationHandler)
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 25,
    margin: 20,
    width: '90%',
    maxHeight: '80%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  countdownContainer: {
    backgroundColor: COLORS.error,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  countdown: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  details: {
    marginBottom: 25,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 14,
    color: COLORS.dark,
    flex: 1,
  },
  orderDetails: {
    backgroundColor: COLORS.light,
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
  },
  orderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 5,
  },
  orderText: {
    fontSize: 14,
    color: COLORS.dark,
  },
  recommendations: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
    marginTop: 5,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.success + '20',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
    borderRadius: 12,
    padding: 15,
    flex: 1,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: COLORS.success,
    borderRadius: 12,
    padding: 15,
    flex: 1,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: COLORS.gray,
    opacity: 0.6,
  },
  rejectText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  acceptText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default DeliveryScreen;