// app/index.tsx
import { COLORS } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSelector } from 'react-redux';

export default function IndexPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useSelector(state => state.auth);

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        console.log('🏠 Index: Redirection vers dashboard...');
        router.replace('/(tabs)/dashboard');
      } else {
        console.log('🔑 Index: Redirection vers login...');
        router.replace('/(auth)/login');
      }
    }
  }, [isAuthenticated, loading]);

  // Écran de chargement
  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: COLORS.white
    }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}