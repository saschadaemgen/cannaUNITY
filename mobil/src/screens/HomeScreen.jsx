import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert, ScrollView } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

export default function HomeScreen({ navigation }) {
  const [token, setToken] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('');

  useEffect(() => {
    loadToken();
    checkBiometricStatus();
  }, []);

  const loadToken = async () => {
    try {
      const savedToken = await SecureStore.getItemAsync('userToken');
      if (savedToken) {
        setToken(savedToken);
      }
    } catch (error) {
      console.error('Error loading token:', error);
    }
  };

  const checkBiometricStatus = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && isEnrolled);

      if (hasHardware) {
        const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID');
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('Fingerabdruck');
        } else {
          setBiometricType('Biometrie');
        }
      }
    } catch (error) {
      console.error('Error checking biometric status:', error);
    }
  };

  const testBiometric = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Test der biometrischen Authentifizierung',
        cancelLabel: 'Abbrechen',
      });

      if (result.success) {
        Alert.alert('Erfolg', 'Biometrische Authentifizierung erfolgreich!');
      } else {
        Alert.alert('Fehler', 'Authentifizierung fehlgeschlagen oder abgebrochen');
      }
    } catch (error) {
      Alert.alert('Fehler', 'Biometrische Authentifizierung nicht verfügbar');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Abmelden',
      'Möchten Sie sich wirklich abmelden? Sie müssen beim nächsten Start den QR-Code erneut scannen.',
      [
        {
          text: 'Abbrechen',
          style: 'cancel',
        },
        {
          text: 'Abmelden',
          style: 'destructive',
          onPress: async () => {
            try {
              await SecureStore.deleteItemAsync('userToken');
              await SecureStore.deleteItemAsync('userData');
              
              // Verwende navigate statt reset
              navigation.navigate('TestCamera');
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Fehler', 'Abmeldung fehlgeschlagen');
            }
          },
        },
      ]
    );
  };

  const maskToken = (tokenString) => {
    if (!tokenString || tokenString.length < 10) return tokenString;
    const firstPart = tokenString.substring(0, 4);
    const lastPart = tokenString.substring(tokenString.length - 4);
    return `${firstPart}...${lastPart}`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.welcomeText}>Willkommen!</Text>
        <Text style={styles.subtitle}>Sie sind erfolgreich angemeldet</Text>
        
        <View style={styles.tokenContainer}>
          <Text style={styles.tokenLabel}>Ihr Token:</Text>
          <Text style={styles.tokenText}>{maskToken(token)}</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Sicherheitsstatus</Text>
          <Text style={styles.infoText}>• Token ist sicher gespeichert ✓</Text>
          <Text style={styles.infoText}>
            • Biometrie: {biometricAvailable ? `${biometricType} aktiv ✓` : 'Nicht verfügbar ✗'}
          </Text>
          <Text style={styles.infoText}>
            • Nächste Anmeldung: {biometricAvailable ? `Mit ${biometricType}` : 'Mit QR-Code'}
          </Text>
        </View>

        {biometricAvailable && (
          <View style={styles.biometricContainer}>
            <Text style={styles.biometricTitle}>Biometrie testen</Text>
            <Button 
              title={`${biometricType} testen`}
              onPress={testBiometric}
              color="#007AFF"
            />
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button 
            title="Zur Kamera" 
            onPress={() => navigation.navigate('TestCamera')}
            color="#007AFF"
          />
          <View style={styles.buttonSpacer} />
          <Button 
            title="Abmelden" 
            onPress={handleLogout}
            color="#FF3B30"
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    padding: 20,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
  },
  tokenContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tokenLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  tokenText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#007AFF',
    backgroundColor: '#F0F0F0',
    padding: 10,
    borderRadius: 5,
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  biometricContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  biometricTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  buttonContainer: {
    marginTop: 20,
  },
  buttonSpacer: {
    height: 15,
  },
});