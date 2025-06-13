// redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import authSlice from './authSlice';
import livraisonSlice from './livraisonSlice';
import locationSlice from './locationSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    livraison: livraisonSlice,
    location: locationSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;





