
// redux/livraisonSlice.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'http://your-api-url.com/api';

// Helper pour obtenir le token
const getAuthToken = async () => {
  const token = await AsyncStorage.getItem('livreurToken');
  return token;
};

// Actions asynchrones
export const fetchLivreurStats = createAsyncThunk(
  'livraison/fetchLivreurStats',
  async (_, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/livreur/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur serveur');
    }
  }
);

export const fetchPendingCommandes = createAsyncThunk(
  'livraison/fetchPendingCommandes',
  async (_, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/commandes/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.commandes;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur serveur');
    }
  }
);

export const acceptCommande = createAsyncThunk(
  'livraison/acceptCommande',
  async (commandeId, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      const response = await axios.post(
        `${API_BASE_URL}/livraisons/accept`,
        { commandeId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.livraison;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur serveur');
    }
  }
);

export const rejectCommande = createAsyncThunk(
  'livraison/rejectCommande',
  async (commandeId, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      await axios.post(
        `${API_BASE_URL}/livraisons/reject`,
        { commandeId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return commandeId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur serveur');
    }
  }
);

export const updateLivreurStatus = createAsyncThunk(
  'livraison/updateLivreurStatus',
  async (isOnline, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      const response = await axios.put(
        `${API_BASE_URL}/livreur/status`,
        { disponible: isOnline },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return isOnline;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur serveur');
    }
  }
);

export const fetchActiveLivraisons = createAsyncThunk(
  'livraison/fetchActiveLivraisons',
  async (_, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(`${API_BASE_URL}/livraisons/active`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.livraisons;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur serveur');
    }
  }
);

export const fetchHistoriqueLivraisons = createAsyncThunk(
  'livraison/fetchHistoriqueLivraisons',
  async (period, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(
        `${API_BASE_URL}/livraisons/historique?period=${period}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.livraisons;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur serveur');
    }
  }
);

export const fetchLivraisonDetails = createAsyncThunk(
  'livraison/fetchLivraisonDetails',
  async (livraisonId, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      const response = await axios.get(
        `${API_BASE_URL}/livraisons/${livraisonId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.livraison;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur serveur');
    }
  }
);

export const updateLivraisonStatus = createAsyncThunk(
  'livraison/updateLivraisonStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      const response = await axios.put(
        `${API_BASE_URL}/livraisons/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { id, status };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur serveur');
    }
  }
);

export const updateLivreurLocation = createAsyncThunk(
  'livraison/updateLivreurLocation',
  async (position, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      await axios.put(
        `${API_BASE_URL}/livreur/location`,
        position,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return position;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur serveur');
    }
  }
);

const livraisonSlice = createSlice({
  name: 'livraison',
  initialState: {
    stats: {
      totalLivraisons: 0,
      note: 5.0,
      gainsJour: 0,
      gainsMois: 0,
    },
    isOnline: false,
    pendingCommandes: [],
    activeLivraisons: [],
    historiqueLivraisons: [],
    currentLivraison: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentLivraison: (state, action) => {
      state.currentLivraison = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch stats
      .addCase(fetchLivreurStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      // Update status
      .addCase(updateLivreurStatus.fulfilled, (state, action) => {
        state.isOnline = action.payload;
      })
      // Pending commandes
      .addCase(fetchPendingCommandes.fulfilled, (state, action) => {
        state.pendingCommandes = action.payload;
      })
      // Accept commande
      .addCase(acceptCommande.fulfilled, (state, action) => {
        state.activeLivraisons.push(action.payload);
        state.pendingCommandes = state.pendingCommandes.filter(
          (cmd) => cmd.id !== action.payload.commandeId
        );
      })
      // Active livraisons
      .addCase(fetchActiveLivraisons.fulfilled, (state, action) => {
        state.activeLivraisons = action.payload;
      })
      // Historique
      .addCase(fetchHistoriqueLivraisons.fulfilled, (state, action) => {
        state.historiqueLivraisons = action.payload;
      })
      // Livraison details
      .addCase(fetchLivraisonDetails.fulfilled, (state, action) => {
        state.currentLivraison = action.payload;
      })
      // Update livraison status
      .addCase(updateLivraisonStatus.fulfilled, (state, action) => {
        const { id, status } = action.payload;
        if (state.currentLivraison && state.currentLivraison.id === id) {
          state.currentLivraison.status = status;
        }
        // Mettre à jour aussi dans activeLivraisons
        const index = state.activeLivraisons.findIndex((l) => l.id === id);
        if (index !== -1) {
          state.activeLivraisons[index].status = status;
        }
      })
      // Error handling
      .addMatcher(
        (action) => action.type.endsWith('/rejected'),
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      )
      .addMatcher(
        (action) => action.type.endsWith('/pending'),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.endsWith('/fulfilled'),
        (state) => {
          state.loading = false;
        }
      );
  },
});

export const { clearError, setCurrentLivraison } = livraisonSlice.actions;
export default livraisonSlice.reducer;
