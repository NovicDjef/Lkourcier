// redux/authSlice.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'http://your-api-url.com/api';

// Actions asynchrones
export const loginLivreur = createAsyncThunk(
  'auth/loginLivreur',
  async ({ identifier, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/livreur/login`, {
        identifier,
        password,
      });

      if (response.data.success) {
        const { token, livreur } = response.data;
        await AsyncStorage.setItem('livreurToken', token);
        await AsyncStorage.setItem('livreurData', JSON.stringify(livreur));
        return { token, user: livreur };
      } else {
        return rejectWithValue(response.data.message);
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur de connexion'
      );
    }
  }
);

export const registerLivreur = createAsyncThunk(
  'auth/registerLivreur',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/livreur/register`, userData);
      
      if (response.data.success) {
        return response.data.livreur;
      } else {
        return rejectWithValue(response.data.message);
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Erreur d\'inscription'
      );
    }
  }
);

export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('livreurToken');
      const userData = await AsyncStorage.getItem('livreurData');

      if (token && userData) {
        // Vérifier la validité du token
        const response = await axios.get(`${API_BASE_URL}/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          return {
            token,
            user: JSON.parse(userData),
          };
        }
      }
      
      throw new Error('No valid auth data');
    } catch (error) {
      await AsyncStorage.multiRemove(['livreurToken', 'livreurData']);
      return rejectWithValue('Session expired');
    }
  }
);

export const logoutLivreur = createAsyncThunk(
  'auth/logoutLivreur',
  async (_, { rejectWithValue }) => {
    try {
      await AsyncStorage.multiRemove(['livreurToken', 'livreurData']);
      return null;
    } catch (error) {
      return rejectWithValue('Erreur lors de la déconnexion');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginLivreur.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginLivreur.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginLivreur.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(registerLivreur.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerLivreur.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(registerLivreur.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Check auth
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      // Logout
      .addCase(logoutLivreur.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      });
  },
});

export const { clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
