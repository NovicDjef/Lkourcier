// redux/livraisonSlice.js - Version propre et corrigée
import { getSomeCommande, getSomeDetailsLivraison, getSomeHistoriqueLivraisons, getSomeStatsLivreur, updateSomeCommandeLivred, updateSomeLivreurLocation, updateSomeUpdateLivraisonStatus } from '@/services/routeApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

// ===== ACTIONS ASYNCHRONES =====

// ✅ Récupérer les commandes disponibles
// export const fetchDisponiblesCommandes = createAsyncThunk(
//   'livraison/fetchDisponiblesCommandes',
//   async (_, { rejectWithValue }) => {
//     try {
      
//       const response = await getSomeCommande();
//       console.log("response data commandes :", response.data);
//       console.log('🔍 DEBUG RESPONSE COMPLETE:');
//       console.log('- response:', !!response);
//       console.log('- response.data:', response.data);
//       console.log('- response.data type:', typeof response.data);
//       console.log('- response.data length:', response.data?.length);
//       console.log('- Array.isArray(response.data):', Array.isArray(response.data));
//       console.log('- response.data.success:', response.data?.success);
//       console.log('- response.status:', response.status);
      
//       if (response.data && response.data.success) {
//         console.log(`✅ ${response.data?.length || 0} commandes disponibles trouvées`);
//         return response.data || [];
        
//       } else {
//         console.log('⚠️ Aucune commande disponible');
//         return [];
//       }
//     } catch (error) {
//       console.error('❌ Erreur récupération commandes disponibles:', error.response?.data);
//       return rejectWithValue(
//         error.response?.data?.message || 'Erreur lors de la récupération des commandes'
//       );
//     }
//   }
// );

export const fetchDisponiblesCommandes = createAsyncThunk(
  'livraison/fetchDisponiblesCommandes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getSomeCommande();
     
     return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération commandes disponibles:', error.response?.data);
      return rejectWithValue(
        error.response.data || 'Erreur lors de la récupération des commandes'
      );
    }
  }
);

// ✅ Accepter une commande


// ✅ Récupérer les livraisons actives du livreur
export const fetchActiveLivraisons = createAsyncThunk(
  'livraison/fetchActiveLivraisons',
  async (livreurId, { rejectWithValue }) => {
    try {
      console.log(`🚴 Récupération livraisons actives pour livreur ${livreurId}...`);
      
      const response = await getSomeActiveLivraisons(livreurId);
      
      if (response.data && response.data.success) {
        console.log(`✅ ${response.data.livraisons?.length || 0} livraisons actives trouvées`);
        return response.data.livraisons || [];
      } else {
        console.log('⚠️ Aucune livraison active');
        return [];
      }
    } catch (error) {
      console.error('❌ Erreur récupération livraisons actives:', error.response?.data);
      return rejectWithValue(
        error.response?.data?.message || 'Erreur lors de la récupération des livraisons'
      );
    }
  }
);

// ✅ Récupérer les détails d'une livraison
export const fetchLivraisonDetails = createAsyncThunk(
  'livraison/fetchLivraisonDetails',
  async (livraisonId, { rejectWithValue }) => {
    try {
      console.log(`📋 Récupération détails livraison ${livraisonId}...`);
      
      const response = await getSomeDetailsLivraison(livraisonId);
      
      if (response.data && response.data.success) {
        console.log('✅ Détails livraison récupérés');
        return response.data.livraison;
      } else {
        return rejectWithValue(response.data?.message || 'Livraison non trouvée');
      }
    } catch (error) {
      console.error('❌ Erreur récupération détails livraison:', error.response?.data);
      return rejectWithValue(
        error.response?.data?.message || 'Impossible de récupérer les détails'
      );
    }
  }
);

// ✅ Mettre à jour le statut d'une livraison
export const updateLivraisonStatus = createAsyncThunk(
  'livraison/updateLivraisonStatus',
  async ({ livraisonId, status, position }, { rejectWithValue }) => {
    try {
      console.log(`🔄 Mise à jour statut livraison ${livraisonId} vers ${status}...`);
      
      const response = await updateSomeUpdateLivraisonStatus(livraisonId, status, position);
      
      if (response.data && response.data.success) {
        console.log('✅ Statut livraison mis à jour');
        return {
          livraisonId,
          updatedLivraison: response.data.livraison
        };
      } else {
        return rejectWithValue(response.data?.message || 'Erreur mise à jour statut');
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour statut livraison:', error.response?.data);
      return rejectWithValue(
        error.response?.data?.message || 'Impossible de mettre à jour le statut'
      );
    }
  }
);

// ✅ Marquer une livraison comme terminée
export const markAsDelivered = createAsyncThunk(
  'livraison/markAsDelivered',
  async ({ livraisonId, livreurId }, { rejectWithValue }) => {
    try {
      console.log(`✅ Marquage livraison ${livraisonId} comme livrée...`);
      
      const response = await updateSomeCommandeLivred(livraisonId, livreurId)
      
      if (response.data && response.data.success) {
        console.log('✅ Livraison marquée comme terminée');
        
        // Nettoyer les données locales
        await AsyncStorage.removeItem('currentLivraison');
        
        return response.data.livraison;
      } else {
        return rejectWithValue(response.data?.message || 'Erreur confirmation livraison');
      }
    } catch (error) {
      console.error('❌ Erreur confirmation livraison:', error.response?.data);
      return rejectWithValue(
        error.response?.data?.message || 'Erreur confirmation livraison'
      );
    }
  }
);

// ✅ Mettre à jour la position du livreur
export const updateLivreurLocation = createAsyncThunk(
  'livraison/updateLivreurLocation',
  async ({ livreurId, latitude, longitude }, { rejectWithValue }) => {
    try {
      const response = await updateSomeLivreurLocation(livreurId, latitude, longitude)
      
      return response.data.livreur
    } catch (error) {
      // Ne pas faire échouer pour éviter de spammer les erreurs
      console.warn('⚠️ Erreur mise à jour position:', error.message);
      return rejectWithValue(
        error.response?.data?.message || 'Erreur confirmation livraison'
      );
    }
  }
);

// ✅ Récupérer les statistiques du livreur
export const fetchLivreurStats = createAsyncThunk(
  'livraison/fetchLivreurStats',
  async (livreurId, { rejectWithValue }) => {
    try {
      console.log(`📊 Récupération stats livreur ${livreurId}...`);
      
      const response = await getSomeStatsLivreur(livreurId)
      
      if (response.data && response.data.success) {
        console.log('✅ Stats livreur récupérées');
        return response.data.stats;
      } else {
        // Retourner des stats par défaut si erreur
        return {
          totalLivraisons: 0,
          note: 5.0,
          livraisonsToday: 0,
          livraisonsThisWeek: 0
        };
      }
    } catch (error) {
      console.warn('⚠️ Erreur stats livreur:', error.response?.data);
      // Retourner des stats par défaut
      return {
        totalLivraisons: 0,
        note: 5.0,
        livraisonsToday: 0,
        livraisonsThisWeek: 0
      };
    }
  }
);

// ✅ Récupérer l'historique des livraisons
export const fetchHistoriqueLivraisons = createAsyncThunk(
  'livraison/fetchHistoriqueLivraisons',
  async ({ livreurId, period = '30' }, { rejectWithValue }) => {
    try {
      console.log(`📜 Récupération historique livraisons...`);
      
      const response = await getSomeHistoriqueLivraisons(livreurId, period)
      
      if (response.data && response.data.success) {
        console.log(`✅ ${response.data.livraisons?.length || 0} livraisons dans l'historique`);
        return response.data.livraisons || [];
      } else {
        return [];
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur historique livraisons'
      );
    }
  }
);

// ===== SLICE REDUX =====

const livraisonSlice = createSlice({
  name: 'livraison',
  initialState: {
    // Commandes disponibles
    commandesDisponibles: [],
    commandesDisponiblesLoading: false,
    commandesDisponiblesError: null,
    
    // Livraisons actives
    activeLivraisons: [],
    activeLivraisonsLoading: false,
    activeLivraisonsError: null,
    
    // Historique des livraisons
    historiqueLivraisons: [],
    historiqueLoading: false,
    historiqueError: null,
    
    // Détails d'une livraison
    currentLivraison: null,
    currentLivraisonLoading: false,
    currentLivraisonError: null,
    
    // Statistiques du livreur
    stats: {
      totalLivraisons: 0,
      note: 5.0,
      livraisonsToday: 0,
      livraisonsThisWeek: 0
    },
    statsLoading: false,
    
    // Position du livreur
    currentLocation: null,
    
    // États généraux
    loading: false,
    error: null,
    
    // Actions en cours
    acceptingCommande: null,
    updatingStatus: null,
    
    // Modal de notification (pour les nouvelles commandes)
    showNotificationModal: false,
    pendingCommande: null,
  },
  
  reducers: {
    // ✅ Actions synchrones
    clearErrors: (state) => {
      state.error = null;
      state.commandesDisponiblesError = null;
      state.activeLivraisonsError = null;
      state.currentLivraisonError = null;
      state.historiqueError = null;
    },
    
    clearCurrentLivraison: (state) => {
      state.currentLivraison = null;
      state.currentLivraisonError = null;
    },
    
    setCurrentLivraison: (state, action) => {
      state.currentLivraison = action.payload;
    },
    
    // ✅ Gestion de la modal de notification
    showCommandeModal: (state, action) => {
      state.showNotificationModal = true;
      state.pendingCommande = action.payload;
    },
    
    hideCommandeModal: (state) => {
      state.showNotificationModal = false;
      state.pendingCommande = null;
    },
    
    // ✅ Mise à jour en temps réel (pour les notifications)
    addNewCommandeDisponible: (state, action) => {
      const newCommande = action.payload;
      // Vérifier que la commande n'existe pas déjà
      const exists = state.commandesDisponibles.find(c => c.id === newCommande.id);
      if (!exists) {
        state.commandesDisponibles.unshift(newCommande); // Ajouter au début
      }
    },
    
    removeCommandeDisponible: (state, action) => {
      const commandeId = action.payload;
      state.commandesDisponibles = state.commandesDisponibles.filter(
        c => c.id !== commandeId
      );
    },
    
    // ✅ Mise à jour d'une livraison en temps réel
    updateLivraisonInList: (state, action) => {
      const updatedLivraison = action.payload;
      const index = state.activeLivraisons.findIndex(l => l.id === updatedLivraison.id);
      if (index !== -1) {
        state.activeLivraisons[index] = updatedLivraison;
      }
    },
    
    // ✅ Mise à jour de la position locale
    updateLocalPosition: (state, action) => {
      state.currentLocation = action.payload;
    },
    
    // ✅ Charger l'état depuis le stockage local
    loadPersistedState: (state, action) => {
      const { currentLivraison } = action.payload;
      if (currentLivraison) {
        state.currentLivraison = currentLivraison;
      }
    },
  },
  
  extraReducers: (builder) => {
    builder
      // ✅ Récupération des commandes disponibles
      .addCase(fetchDisponiblesCommandes.pending, (state) => {
        state.commandesDisponiblesLoading = true;
        state.commandesDisponiblesError = null;
        state.loading = true;
      })
      .addCase(fetchDisponiblesCommandes.fulfilled, (state, action) => {
        state.commandesDisponiblesLoading = false;
        state.commandesDisponibles = action.payload;
        state.loading = false;
      })
      .addCase(fetchDisponiblesCommandes.rejected, (state, action) => {
        state.commandesDisponiblesLoading = false;
        state.commandesDisponiblesError = action.payload;
        state.loading = false;
      })
      
      // ✅ Acceptation d'une commande
      // .addCase(accepterCommande.pending, (state, action) => {
      //   state.acceptingCommande = action.meta.arg.commandeId;
      //   state.error = null;
      // })
      // .addCase(accepterCommande.fulfilled, (state, action) => {
      //   state.acceptingCommande = null;
        
      //   // Supprimer la commande des disponibles
      //   state.commandesDisponibles = state.commandesDisponibles.filter(
      //     c => c.id !== action.payload.commandeId
      //   );
        
      //   // Ajouter aux livraisons actives si ce n'est pas déjà fait
      //   const livraison = action.payload.livraison;
      //   if (livraison) {
      //     const exists = state.activeLivraisons.find(l => l.id === livraison.id);
      //     if (!exists) {
      //       state.activeLivraisons.unshift(livraison);
      //     }
      //     // Définir comme livraison courante
      //     state.currentLivraison = livraison;
      //   }
        
      //   // Fermer la modal
      //   state.showNotificationModal = false;
      //   state.pendingCommande = null;
      // })
      // .addCase(accepterCommande.rejected, (state, action) => {
      //   state.acceptingCommande = null;
      //   state.error = action.payload;
      // })
      
      // ✅ Récupération des livraisons actives
      .addCase(fetchActiveLivraisons.pending, (state) => {
        state.activeLivraisonsLoading = true;
        state.activeLivraisonsError = null;
        state.loading = true;
      })
      .addCase(fetchActiveLivraisons.fulfilled, (state, action) => {
        state.activeLivraisonsLoading = false;
        state.activeLivraisons = action.payload;
        state.loading = false;
      })
      .addCase(fetchActiveLivraisons.rejected, (state, action) => {
        state.activeLivraisonsLoading = false;
        state.activeLivraisonsError = action.payload;
        state.loading = false;
      })
      
      // ✅ Récupération des détails d'une livraison
      .addCase(fetchLivraisonDetails.pending, (state) => {
        state.currentLivraisonLoading = true;
        state.currentLivraisonError = null;
      })
      .addCase(fetchLivraisonDetails.fulfilled, (state, action) => {
        state.currentLivraisonLoading = false;
        state.currentLivraison = action.payload;
      })
      .addCase(fetchLivraisonDetails.rejected, (state, action) => {
        state.currentLivraisonLoading = false;
        state.currentLivraisonError = action.payload;
      })
      
      // ✅ Mise à jour du statut d'une livraison
      .addCase(updateLivraisonStatus.pending, (state, action) => {
        state.updatingStatus = action.meta.arg.livraisonId;
        state.error = null;
      })
      .addCase(updateLivraisonStatus.fulfilled, (state, action) => {
        state.updatingStatus = null;
        
        const { livraisonId, updatedLivraison } = action.payload;
        
        // Mettre à jour dans la liste des livraisons actives
        const index = state.activeLivraisons.findIndex(l => l.id === livraisonId);
        if (index !== -1) {
          state.activeLivraisons[index] = updatedLivraison;
        }
        
        // Mettre à jour la livraison courante si c'est la même
        if (state.currentLivraison?.id === livraisonId) {
          state.currentLivraison = updatedLivraison;
        }
      })
      .addCase(updateLivraisonStatus.rejected, (state, action) => {
        state.updatingStatus = null;
        state.error = action.payload;
      })
      
      // ✅ Marquer comme livrée
      .addCase(markAsDelivered.pending, (state) => {
        state.loading = true;
      })
      .addCase(markAsDelivered.fulfilled, (state, action) => {
        state.loading = false;
        const deliveredLivraison = action.payload;
        
        // Supprimer de la liste active
        state.activeLivraisons = state.activeLivraisons.filter(
          l => l.id !== deliveredLivraison.id
        );
        
        // Ajouter à l'historique
        state.historiqueLivraisons.unshift(deliveredLivraison);
        
        // Nettoyer la livraison courante
        if (state.currentLivraison?.id === deliveredLivraison.id) {
          state.currentLivraison = null;
        }
      })
      .addCase(markAsDelivered.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ✅ Position livreur
      .addCase(updateLivreurLocation.fulfilled, (state, action) => {
        state.currentLocation = action.payload;
      })
      
      // ✅ Statistiques
      .addCase(fetchLivreurStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchLivreurStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchLivreurStats.rejected, (state) => {
        state.statsLoading = false;
      })
      
      // ✅ Historique
      .addCase(fetchHistoriqueLivraisons.pending, (state) => {
        state.historiqueLoading = true;
        state.historiqueError = null;
      })
      .addCase(fetchHistoriqueLivraisons.fulfilled, (state, action) => {
        state.historiqueLoading = false;
        state.historiqueLivraisons = action.payload;
      })
      .addCase(fetchHistoriqueLivraisons.rejected, (state, action) => {
        state.historiqueLoading = false;
        state.historiqueError = action.payload;
      });
  },
});

// ✅ Export des actions
export const {
  clearErrors,
  clearCurrentLivraison,
  setCurrentLivraison,
  showCommandeModal,
  hideCommandeModal,
  addNewCommandeDisponible,
  removeCommandeDisponible,
  updateLivraisonInList,
  updateLocalPosition,
  loadPersistedState,
} = livraisonSlice.actions;



export default livraisonSlice.reducer;