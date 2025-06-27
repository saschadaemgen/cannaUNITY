import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { View, ActivityIndicator, Text, Button, StyleSheet, Alert } from 'react-native';

import TestCameraScreen from '../screens/TestCameraScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';

const Stack = createNativeStackNavigator();

function BiometricScreen({ navigation }) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    authenticateWithBiometrics();
  }, []);

  const authenticateWithBiometrics = async () => {
    try {
      setIsAuthenticating(true);
      
      // Prüfe ob Biometrie verfügbar ist
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

      // Authentifizierung durchführen
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authentifizieren Sie sich',
        cancelLabel: 'Abbrechen',
        fallbackLabel: 'Passcode verwenden',
        disableDeviceFallback: false,
      });

      if (result.success) {
        navigation.replace('Home');
      } else {
        Alert.alert(
          'Authentifizierung fehlgeschlagen',
          'Möchten Sie es erneut versuchen?',
          [
            {
              text: 'Erneut versuchen',
              onPress: () => authenticateWithBiometrics()
            },
            {
              text: 'Mit QR-Code anmelden',
              onPress: () => navigation.replace('Login')
            }
          ]
        );
      }
    } catch (error) {
      console.error('Biometric error:', error);
      Alert.alert('Fehler', 'Biometrische Authentifizierung fehlgeschlagen');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Willkommen zurück!</Text>
      <Text style={styles.subtitle}>Bitte authentifizieren Sie sich</Text>
      
      {isAuthenticating && (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      )}
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Erneut versuchen" 
          onPress={authenticateWithBiometrics}
          disabled={isAuthenticating}
        />
        <View style={styles.spacer} />
        <Button 
          title="Mit QR-Code anmelden" 
          onPress={() => navigation.replace('Login')}
          color="#666"
        />
      </View>
    </View>
  );
}

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      setUserToken(token);
    } catch (error) {
      console.error('Error checking token:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Alle Screens sind immer verfügbar, nur die initialRouteName ändert sich
  return (
    <Stack.Navigator initialRouteName={userToken ? "Biometric" : "TestCamera"}>
      <Stack.Screen 
        name="TestCamera" 
        component={TestCameraScreen} 
        options={{ title: 'Kamera Test' }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ 
          title: 'QR-Code Login',
          headerLeft: null 
        }}
      />
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          title: 'Home',
          headerLeft: null,
          gestureEnabled: false 
        }}
      />
      <Stack.Screen 
        name="Biometric" 
        component={BiometricScreen} 
        options={{ 
          title: 'Authentifizierung',
          headerShown: false 
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  loader: {
    marginVertical: 20,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    marginTop: 40,
  },
  spacer: {
    height: 15,
  },
});