import { accepterSomeCommande, getSomeCommande } from '@/services/routeApi'; // Assurez-vous que le chemin d'importation est correct
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';


export const getCommandesAsync = createAsyncThunk(
  'commande/fetchCommandes',
  async (_, { rejectWithValue }) => {
    try {
      // Appel API pour récupérer la liste des commandes
      const response = await getSomeCommande();
      return response.data; // On retourne les données des commandes
    } catch (error) {
      // Gestion des erreurs avec rejectWithValue
      console.error("Erreur lors de la récupération des commandes:", error.response?.data);
      return rejectWithValue(error.response?.data || { message: "Impossible de récupérer les commandes" });
    }
  }
);

export const accepterCommande = createAsyncThunk(
  'livraison/accepterCommande',
  async ({ commandeId, livreurId }, { rejectWithValue }) => {
    try {
      
      const response = await accepterSomeCommande(commandeId, livreurId)
      
      if (response.data && response.data.success) {
        console.log('✅ Commande acceptée avec succès');
        
        // Sauvegarder la livraison courante
        if (response.data.commande) {
          await AsyncStorage.setItem('currentLivraison', JSON.stringify(response.data.commande));
        }
        
        return {
          commandeId,
          livraison: response.data.commande
        };
      } else {
        return rejectWithValue(response.data?.message || 'Erreur lors de l\'acceptation');
      }
    } catch (error) {
      console.error('❌ Erreur acceptation commande:', error.response?.data);
      return rejectWithValue(
        error.response?.data?.message || 'Impossible d\'accepter la commande'
      );
    }
  }
);

// export const createCommandeAsync = createAsyncThunk(
//     'commande/addSomeCommande',
//     async (commandeData, { rejectWithValue }) => {
//       try {
//         console.log("Données envoyées à l'API:", commandeData);
//         const response = await addSomeCommande(commandeData);
//         return response.data;
//       } catch (error) {
//         console.error("Erreur lors de l'appel API:", error.response?.data);
//         return rejectWithValue(error.response?.data || { message: "Une erreur est survenue" });
//       }
//     }
//   );

//   export const updateCommandeStatusAsync = createAsyncThunk(
//     'commande/updateStatus',
//     async ({ id, status }, { rejectWithValue }) => {
//       try {
//         const response = await apiService.patch(`/commande/${id}`, { status });
//         return response.data.commande;
//       } catch (error) {
//         console.error("Erreur lors de la mise à jour du statut de la commande:", error.response?.data);
//         return rejectWithValue(error.response?.data || { message: "Impossible de mettre à jour le statut de la commande" });
//       }
//     }
//   );

  const commandeSlice = createSlice({
    name: 'commande',
    initialState: {
      currentCommande: null,
      commandes: [], // On ajoute un état pour stocker les commandes
      status: 'idle',
      error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
      builder
      //  Gestion de la création de commande
        .addCase(accepterCommande.pending, (state) => {
          state.status = 'loading';
        })
        .addCase(accepterCommande.fulfilled, (state, action) => {
          state.status = 'succeeded';
          state.currentCommande = action.payload;
        })
        .addCase(accepterCommande.rejected, (state, action) => {
          state.status = 'failed';
          state.error = action.payload?.message || "Une erreur est survenue";
        })
  
        // Gestion de la récupération des commandes
        .addCase(getCommandesAsync.pending, (state) => {
          state.status = 'loading';
        })
        .addCase(getCommandesAsync.fulfilled, (state, action) => {
          state.status = 'succeeded';
          state.commandes = action.payload; // Mettre à jour la liste des commandes
        })
        .addCase(getCommandesAsync.rejected, (state, action) => {
          state.status = 'failed';
          state.error = action.payload?.message || "Impossible de récupérer les commandes";
        })

    //     .addCase(updateCommandeStatusAsync.pending, (state) => {
    //       state.status = 'loading';
    //     })
    //     .addCase(updateCommandeStatusAsync.fulfilled, (state, action) => {
    //       state.status = 'succeeded';
    //       // Mettre à jour le statut de la commande dans la liste des commandes
    //       const index = state.commandes.findIndex(commande => commande.id === action.payload.id);
    //       if (index !== -1) {
    //         state.commandes[index] = action.payload;
    //       }
    //       // Si c'est la commande courante, mettre à jour currentCommande aussi
    //       if (state.currentCommande && state.currentCommande.id === action.payload.id) {
    //         state.currentCommande = action.payload;
    //       }
    //     })
    //     .addCase(updateCommandeStatusAsync.rejected, (state, action) => {
    //       state.status = 'failed';
    //       state.error = action.payload?.message || "Impossible de mettre à jour le statut de la commande";
    //     });
    },
  });
  
  export const { resetCommandeState } = commandeSlice.actions;
  export default commandeSlice.reducer;