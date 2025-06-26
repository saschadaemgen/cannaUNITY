import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Image 
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

export default function BiometricScreen({ navigation }) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricType, setBiometricType] = useState('');

  useEffect(() => {
    checkBiometricType();
    // Auto-start nach kürzerer Verzögerung
    setTimeout(() => {
      authenticateWithBiometrics();
    }, 800);
  }, []);

  const checkBiometricType = async () => {
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      setBiometricType('Face ID');
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      setBiometricType('Fingerabdruck');
    } else {
      setBiometricType('Biometrie');
    }
  };

  const authenticateWithBiometrics = async () => {
    try {
      setIsAuthenticating(true);
      
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          'Biometrie nicht verfügbar',
          'Ihr Gerät unterstützt keine biometrische Authentifizierung oder sie ist nicht eingerichtet.',
          [
            {
              text: 'QR-Code scannen',
              onPress: () => navigation.replace('Login')
            }
          ]
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authentifizieren Sie sich',
        cancelLabel: 'Abbrechen',
        fallbackLabel: 'Passcode verwenden',
        disableDeviceFallback: false,
      });

      if (result.success) {
        navigation.replace('Home');
      } else {
        setIsAuthenticating(false);
      }
    } catch (error) {
      console.error('Biometric error:', error);
      Alert.alert('Fehler', 'Biometrische Authentifizierung fehlgeschlagen');
      setIsAuthenticating(false);
    }
  };

  const getIcon = () => {
    if (biometricType === 'Face ID') {
      return 'scan';
    } else if (biometricType === 'Fingerabdruck') {
      return 'finger-print';
    }
    return 'shield-checkmark';
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        
        <Text style={styles.title}>Willkommen zurück!</Text>
        <Text style={styles.subtitle}>
          Bitte authentifizieren Sie sich mit {biometricType}
        </Text>
        
        <View style={styles.biometricContainer}>
          {isAuthenticating ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : (
            <TouchableOpacity 
              style={styles.biometricButton}
              onPress={authenticateWithBiometrics}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={getIcon()} 
                size={60} 
                color={theme.colors.primary} 
              />
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.instruction}>
          {isAuthenticating 
            ? 'Authentifizierung läuft...' 
            : `Tippen Sie zum Aktivieren von ${biometricType}`
          }
        </Text>
        
        <View style={styles.alternativeContainer}>
          <TouchableOpacity 
            style={styles.textButton}
            onPress={() => navigation.replace('Login')}
          >
            <Text style={styles.textButtonText}>
              Mit QR-Code anmelden
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xxl,
    textAlign: 'center',
  },
  biometricContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  biometricButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  instruction: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xxl,
    textAlign: 'center',
  },
  alternativeContainer: {
    position: 'absolute',
    bottom: 50,
  },
  textButton: {
    padding: theme.spacing.md,
  },
  textButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});