import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
// import LottieView from 'lottie-react-native';
import { COLORS } from '@/constants/Colors';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import PagerView from 'react-native-pager-view';
const { width, height } = Dimensions.get('window');



const onboardingData = [
  {
    id: 1,
    title: 'Bienvenue chez nous',
    subtitle: 'Rejoignez notre équipe de livreurs et commencez à gagner de l\'argent dès aujourd\'hui',
    //animation: require('@/assets/animations/welcome.json'),
    backgroundColor: COLORS.primary,
  },
  {
    id: 2,
    title: 'Recevez des commandes',
    subtitle: 'Soyez notifié instantanément des nouvelles commandes près de chez vous',
    //animation: require('@/assets/animations/notification.json'),
    backgroundColor: COLORS.secondary,
  },
  {
    id: 3,
    title: 'Navigation facile',
    subtitle: 'Interface intuitive avec navigation GPS intégrée pour vous guider',
    //animation: require('@/assets/animations/navigation.json'),
    backgroundColor: COLORS.primary,
  },
  {
    id: 4,
    title: 'Gagnez plus',
    subtitle: 'Maximisez vos revenus avec notre système de bonus et de primes',
    //animation: require('@/assets/animations/money.json'),
    backgroundColor: COLORS.secondary,
  },
];

// const OnboardingScreen = () => {
//   const [currentPage, setCurrentPage] = useState(0);
//   const pagerRef = useRef(null);

//   const handleNext = async () => {
//     if (currentPage < onboardingData.length - 1) {
//       pagerRef.current?.setPage(currentPage + 1);
//     } else {
//       await finishOnboarding();
//     }
//   };

//   const handleSkip = async () => {
//     await finishOnboarding();
//   };

//   const finishOnboarding = async () => {
//     await AsyncStorage.setItem('hasSeenOnboarding', 'true');
//     router.replace('/(auth)/login');
//   };

//   const renderPage = ({ item, index }) => (
//     <View 
//       key={item.id}
//       style={[styles.page, { backgroundColor: item.backgroundColor }]}
//     >
//       <View style={styles.animationContainer}>
//         {/* <LottieView
//           source={item.animation}
//           autoPlay
//           loop
//           style={styles.animation}
//         /> */}
//       </View>
      
//       <View style={styles.textContainer}>
//         <Text style={styles.title}>{item.title}</Text>
//         <Text style={styles.subtitle}>{item.subtitle}</Text>
//       </View>
      
//       <View style={styles.indicatorContainer}>
//         {onboardingData.map((_, idx) => (
//           <View
//             key={idx}
//             style={[
//               styles.indicator,
//               idx === index ? styles.activeIndicator : styles.inactiveIndicator,
//             ]}
//           />
//         ))}
//       </View>
      
//       <View style={styles.buttonContainer}>
//         {index < onboardingData.length - 1 ? (
//           <View style={styles.buttonRow}>
//             <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
//               <Text style={styles.skipText}>Passer</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
//               <Text style={styles.nextText}>Suivant</Text>
//               <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
//             </TouchableOpacity>
//           </View>
//         ) : (
//           <TouchableOpacity style={styles.startButton} onPress={handleNext}>
//             <Text style={styles.startText}>Commencer</Text>
//           </TouchableOpacity>
//         )}
//       </View>
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       <PagerView
//         ref={pagerRef}
//         style={styles.pagerView}
//         initialPage={0}
//         onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
//       >
//         {onboardingData.map((item, index) => (
//           <View key={item.id}>
//             {renderPage({ item, index })}
//           </View>
//         ))}
//       </PagerView>
//     </View>
//   );
// };

const OnboardingScreen = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const pagerRef = useRef(null);

  const handleNext = async () => {
    if (currentPage < onboardingData.length - 1) {
      pagerRef.current?.setPage(currentPage + 1);
    } else {
      await finishOnboarding();
    }
  };

  const handleSkip = async () => {
    await finishOnboarding();
  };

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde onboarding:', error);
      // Même en cas d'erreur, on redirige vers login
      router.replace('/(auth)/login');
    }
  };

  const renderPage = (item, index) => (
    <View 
      key={item.id}
      style={[styles.page, { backgroundColor: item.backgroundColor }]}
    >
      <View style={styles.animationContainer}>
        {/* Placeholder pour animation */}
        <View style={styles.placeholderAnimation}>
          <Ionicons 
            name={
              index === 0 ? "people" : 
              index === 1 ? "notifications" : 
              index === 2 ? "map" : "cash"
            } 
            size={100} 
            color={COLORS.white} 
          />
        </View>
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
      
      <View style={styles.indicatorContainer}>
        {onboardingData.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.indicator,
              idx === index ? styles.activeIndicator : styles.inactiveIndicator,
            ]}
          />
        ))}
      </View>
      
      <View style={styles.buttonContainer}>
        {index < onboardingData.length - 1 ? (
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipText}>Passer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextText}>Suivant</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.startButton} onPress={handleNext}>
            <Text style={styles.startText}>Commencer</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
      >
        {onboardingData.map((item, index) => 
          renderPage(item, index)
        )}
      </PagerView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 50,
  },
  animationContainer: {
    flex: 0.4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: width * 0.8,
    height: height * 0.3,
  },
  textContainer: {
    flex: 0.3,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  activeIndicator: {
    backgroundColor: COLORS.white,
  },
  inactiveIndicator: {
    backgroundColor: COLORS.white + '50',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 15,
    paddingHorizontal: 25,
  },
  skipText: {
    color: COLORS.white,
    fontSize: 16,
    opacity: 0.8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white + '20',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  nextText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  startButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 18,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
 
});

export default OnboardingScreen;