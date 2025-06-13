// app/(auth)/login.js
import { loginLivreur } from '@/redux/authSlice';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useDispatch } from 'react-redux';

const COLORS = {
  primary: '#4CAF50',
  secondary: '#FF9800',
  dark: '#212121',
  gray: '#757575',
  white: '#FFFFFF',
  light: '#F5F5F5',
  error: '#F44336',
};

const LoginScreen = () => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    identifier: '', // Email ou téléphone
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!formData.identifier || !formData.password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      const result = await dispatch(loginLivreur(formData));
      
      if (loginLivreur.fulfilled.match(result)) {
        // Succès - redirection automatique via _layout.js
        Alert.alert('Succès', 'Connexion réussie !');
      } else {
        Alert.alert('Erreur', result.payload || 'Erreur de connexion');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Animation de bienvenue */}
        <View style={styles.animationContainer}>
          <LottieView
            source={require('@/assets/animations/delivery-truck.json')}
            autoPlay
            loop
            style={styles.animation}
          />
        </View>

        {/* Titre */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Connexion Livreur</Text>
          <Text style={styles.subtitle}>
            Connectez-vous pour commencer vos livraisons
          </Text>
        </View>

        {/* Formulaire */}
        <View style={styles.formContainer}>
          {/* Email ou Téléphone */}
          <View style={styles.inputContainer}>
            <Ionicons name="person" size={20} color={COLORS.gray} />
            <TextInput
              style={styles.input}
              placeholder="Email ou numéro de téléphone"
              value={formData.identifier}
              onChangeText={(text) =>
                setFormData({ ...formData, identifier: text })
              }
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Mot de passe */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color={COLORS.gray} />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              value={formData.password}
              onChangeText={(text) =>
                setFormData({ ...formData, password: text })
              }
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={COLORS.gray}
              />
            </TouchableOpacity>
          </View>

          {/* Bouton de connexion */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.buttonText}>Connexion...</Text>
            ) : (
              <Text style={styles.buttonText}>Se connecter</Text>
            )}
          </TouchableOpacity>

          {/* Lien vers inscription */}
          <TouchableOpacity
            style={styles.linkContainer}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.linkText}>
              Pas encore inscrit ?{' '}
              <Text style={styles.linkTextBold}>Créer un compte</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  animationContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  animation: {
    width: 150,
    height: 150,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 55,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.dark,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: COLORS.gray,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  linkTextBold: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

export default LoginScreen;