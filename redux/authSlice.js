import { fetchSomeLoginLivreur, fetchSomeRegisterLivreur } from '@/services/routeApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';


const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Erreur décodage token:', error);
    return true;
  }
};

export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔍 Vérification du statut d\'authentification...');
      
      const token = await AsyncStorage.getItem('livreurToken');
      const userDataString = await AsyncStorage.getItem('livreurData');
      
      if (token && userDataString) {
        // Vérifier si le token n'est pas expiré
        if (!isTokenExpired(token)) {
          const userData = JSON.parse(userDataString);
          console.log('✅ Utilisateur authentifié:', userData.username);
          return {
            token,
            user: userData,
            isAuthenticated: true
          };
        } else {
          console.log('⏰ Token expiré, suppression...');
          await AsyncStorage.multiRemove(['livreurToken', 'livreurData']);
          return rejectWithValue('Token expiré');
        }
      } else {
        console.log('❌ Aucune session trouvée');
        return rejectWithValue('Aucune session');
      }
    } catch (error) {
      console.error('Erreur vérification auth:', error);
      return rejectWithValue('Erreur de vérification');
    }
  }
);

// Actions asynchrones
export const loginLivreur = createAsyncThunk(
  'auth/loginLivreur',
  async ({ identifier, password }, { rejectWithValue }) => {
    try {
      console.log('🔑 Tentative de connexion...');
      
      const response = await fetchSomeLoginLivreur(identifier, password);
      
      if (response.data && response.data.token) {
        const { token, livreur } = response.data;
        
        // Sauvegarder dans AsyncStorage
        await AsyncStorage.setItem('livreurToken', token);
        await AsyncStorage.setItem('livreurData', JSON.stringify(livreur));
        
        console.log('✅ Connexion réussie:', livreur.username);
        
        return {
          token,
          user: livreur,
          message: response.data.message
        };
      } else {
        return rejectWithValue('Réponse invalide du serveur');
      }
    } catch (error) {
      console.error('❌ Erreur connexion:', error.response?.data);
      return rejectWithValue(
        error.response?.data?.message || 'Erreur de connexion'
      );
    }
  }
);

// ✅ Action pour l'inscription
export const registerLivreur = createAsyncThunk(
  'auth/registerLivreur',
  async (userData, { rejectWithValue }) => {
    try {
      console.log('📝 Tentative d\'inscription...');
      
      const response = await fetchSomeRegisterLivreur(userData);
      
      if (response.data && response.data.token) {
        const { token, livreur } = response.data;
        
        // Sauvegarder dans AsyncStorage
        await AsyncStorage.setItem('livreurToken', token);
        await AsyncStorage.setItem('livreurData', JSON.stringify(livreur));
        
        console.log('✅ Inscription réussie:', livreur.username);
        
        return {
          token,
          user: livreur,
          message: response.data.message
        };
      } else {
        return rejectWithValue('Réponse invalide du serveur');
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur d\'inscription'
      );
    }
  }
);

export const logoutLivreur = createAsyncThunk(
  'auth/logoutLivreur',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🚪 Déconnexion...');
      await AsyncStorage.multiRemove(['livreurToken', 'livreurData']);
      console.log('✅ Déconnexion réussie');
      return true;
    } catch (error) {
      console.error('❌ Erreur déconnexion:', error);
      return rejectWithValue('Erreur de déconnexion');
    }
  }
);

// ✅ Slice Redux
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true, // ✅ Important : commencer avec loading = true
    error: null,
  },
  reducers: {
    // Action pour clear les erreurs
    clearError: (state) => {
      state.error = null;
    },
    // Action pour reset l'état
    resetAuthState: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // ✅ Vérification du statut d'authentification
      .addCase(checkAuthStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
      })
      
      // ✅ Connexion
      .addCase(loginLivreur.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginLivreur.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(loginLivreur.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
      })
      
      // ✅ Inscription
      .addCase(registerLivreur.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerLivreur.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(registerLivreur.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ✅ Déconnexion
      .addCase(logoutLivreur.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutLivreur.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = null;
      })
      .addCase(logoutLivreur.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, resetAuthState } = authSlice.actions;
export default authSlice.reducer;