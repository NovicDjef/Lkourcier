import { Ionicons } from '@expo/vector-icons';
// import LottieView from 'lottie-react-native';
import { COLORS } from '@/constants/Colors';
import { loginLivreur } from '@/redux/authSlice';
import { updateLivreurStatus } from '@/redux/livraisonSlice';
import { Notifications } from 'expo';
import Constants from 'expo-constants';
import { Device } from 'expo-device';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useDispatch } from 'react-redux';


const LoginScreen = () => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    identifier: '', 
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const getExpoPushToken = async () => {
    try {
      console.log('📱 Récupération token Expo Push...');
      
      // Vérifier si c'est un appareil physique
      if (Device.isDevice) {
        // Demander les permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.warn('❌ Permissions notifications refusées');
          Alert.alert(
            'Notifications requises',
            'Activez les notifications pour recevoir les commandes.',
            [
              { text: 'Plus tard', style: 'cancel' },
              { 
                text: 'Paramètres', 
                onPress: () => {
                  Linking.openSettings();
                }
              }
            ]
          );
          return null;
        }

        console.log('✅ Permissions notifications accordées');
        
        // Récupérer le token Expo Push
        const token = (await Notifications.getExpoPushTokenAsync({
          projectId: Constants.easConfig?.projectId,
        })).data;
        
        console.log('🎯 Token Expo Push récupéré:', token.substring(0, 30) + '...');
        return token;
        
      } else {
        console.warn('🖥️ Émulateur détecté, token non disponible');
        return null;
      }
    } catch (error) {
      console.error('❌ Erreur récupération token Expo:', error);
      return null;
    }
  };



  const handleLogin = async () => {
    if (!formData.identifier || !formData.password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔑 Tentative de connexion avec:', {
        identifier: formData.identifier,
        password: '***masqué***'
      });

      // Étape 1: Connexion du livreur
      const result = await dispatch(loginLivreur(formData));
      console.log('📋 Résultat de la connexion:', result.type);

      if (loginLivreur.fulfilled.match(result)) {
        console.log('✅ Connexion réussie pour:', result.payload.user?.username);
        
        // Étape 2: Récupérer le token Expo Push
        console.log('📱 Récupération du token Expo Push...');
        const expoPushToken = await getExpoPushToken();
        
        // Étape 3: Envoyer le token au serveur
        if (result.payload.user?.id) {
          try {
            console.log('📤 Envoi token Expo au serveur...');
            
            const statusResult = await dispatch(updateLivreurStatus({
              livreurId: result.payload.user.id,
              pushToken: expoPushToken,
              deviceId: `expo-${Constants.sessionId || Date.now()}`,
              disponible: false // Commencer hors ligne par défaut
            }));

            if (updateLivreurStatus.fulfilled.match(statusResult)) {
              console.log('✅ Token Expo envoyé avec succès au serveur');
            } else {
              console.warn('⚠️ Erreur envoi token:', statusResult.payload);
            }
          } catch (tokenError) {
            console.warn('⚠️ Erreur lors de l\'envoi du token:', tokenError);
          }
        }

        // Étape 4: Navigation réussie
        Alert.alert(
          'Succès',
          `Bienvenue ${result.payload.user?.prenom || result.payload.user?.username} !\n${expoPushToken ? '🔔 Notifications activées' : '⚠️ Notifications désactivées'}`,
          [
            {
              text: 'OK',
              onPress: () => {
                console.log('🏠 Navigation vers dashboard...');
                router.replace('/(tabs)/dashboard');
              }
            }
          ]
        );

      } else {
        console.log('❌ Erreur de connexion:', result.payload);
        Alert.alert('Erreur', result.payload || 'Erreur de connexion');
      }

    } catch (error) {
      console.error('❌ Erreur lors de la connexion:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la connexion');
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
          {/* <LottieView
            source={require('@/assets/animations/delivery-truck.json')}
            autoPlay
            loop
            style={styles.animation}
          /> */}
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
              <Text style={styles.buttonText}><ActivityIndicator size="small" color={COLORS.white} /></Text>
            ) : (
              <Text style={styles.buttonText}>Se connecter</Text>
            )}
          </TouchableOpacity>
            {/* {__DEV__ && (
              <Button 
                title="🔄 Refresh Token Firebase"
                onPress={refreshFirebaseToken}
                disabled={loading}
              />
            )} */}
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