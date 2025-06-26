import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, Dimensions, ActivityIndicator } from 'react-native';
import { theme } from '../styles/theme';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onAnimationComplete }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const loadingOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Alle Animationen parallel starten
    Animated.parallel([
      // Logo fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      // Logo scale
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 3,
        useNativeDriver: true,
      }),
      // Text fade in - GLEICHZEITIG
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 1000,
        delay: 300, // Kleiner delay
        useNativeDriver: true,
      }),
      // Loading indicator
      Animated.timing(loadingOpacity, {
        toValue: 1,
        duration: 400,
        delay: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // 3.5 Sekunden total
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onAnimationComplete();
      });
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        {/* Logo Animation */}
        <Animated.View
          style={[
            styles.logoSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </Animated.View>
        
        {/* Text ohne Animation zum Testen */}
        <View style={styles.textSection}>
          <Text style={styles.title}>cannaUNITY</Text>
          <Text style={styles.subtitle}>AVRE</Text>
          <Text style={styles.tagline}>Recklinghausen</Text>
          <Text style={styles.heart}>❤️</Text>
        </View>
      </View>
      
      {/* Loading Indicator */}
      <Animated.View style={[styles.loadingContainer, { opacity: loadingOpacity }]}>
        <ActivityIndicator size="small" color="rgba(255, 255, 255, 0.8)" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoSection: {
    alignItems: 'center',
  },
  logoContainer: {
    width: width * 0.4,
    height: width * 0.4,
    marginBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  textSection: {
    alignItems: 'center',
    marginTop: 30,
    width: '100%',
  },
  title: {
    fontSize: 44,
    fontWeight: '700', // Numerisch statt 'bold'
    color: '#FFFFFF',
    marginBottom: 10,
    letterSpacing: 3,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 36,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: 12,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '300',
    letterSpacing: 1,
    marginBottom: 10,
  },
  heart: {
    fontSize: 20,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
  },
});