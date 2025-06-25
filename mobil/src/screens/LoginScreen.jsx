import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as SecureStore from 'expo-secure-store';

// WICHTIG: In einer echten App würde dies von Ihrer API kommen
const VALID_TOKEN_PATTERN = /^CANNA-\d{4}-[A-Z0-9]{8}$/;
const API_ENDPOINT = 'https://your-api.com/validate-token'; // Beispiel

export default function LoginScreen({ navigation }) {
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setScanned(false);
      setIsProcessing(false);
      setIsFocused(true);
    });

    const blurUnsubscribe = navigation.addListener('blur', () => {
      setIsFocused(false);
    });

    return () => {
      unsubscribe();
      blurUnsubscribe();
    };
  }, [navigation]);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Wir benötigen Ihre Erlaubnis, um die Kamera für den QR-Code Scanner zu verwenden</Text>
        <Button onPress={requestPermission} title="Erlaubnis erteilen" />
      </View>
    );
  }

  // Token-Validierung
  const validateToken = async (token) => {
    // Option 1: Lokale Validierung mit Regex
    if (!VALID_TOKEN_PATTERN.test(token)) {
      return { valid: false, message: 'Ungültiges Token-Format' };
    }

    // Option 2: Server-Validierung (empfohlen für echte Apps)
    try {
      // In einer echten App würden Sie hier Ihre API aufrufen
      /*
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      
      const result = await response.json();
      return {
        valid: result.valid,
        message: result.message,
        userData: result.userData // z.B. Name, Rolle, etc.
      };
      */

      // Für Demo: Simuliere Server-Antwort
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simuliere Netzwerk-Delay
      
      // Beispiel: Nur bestimmte Tokens sind gültig
      const validTokens = [
        'CANNA-2024-ABCD1234',
        'CANNA-2024-EFGH5678',
        'CANNA-2024-IJKL9012',
      ];

      if (validTokens.includes(token)) {
        return { 
          valid: true, 
          message: 'Token gültig',
          userData: {
            name: 'Test User',
            role: 'member',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 Tage
          }
        };
      }

      return { valid: false, message: 'Token nicht in der Datenbank gefunden' };
      
    } catch (error) {
      console.error('Validation error:', error);
      return { valid: false, message: 'Netzwerkfehler bei der Validierung' };
    }
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || isProcessing) return;
    
    setScanned(true);
    setIsProcessing(true);

    try {
      // Basis-Prüfung
      if (!data || data.length < 10) {
        Alert.alert('Fehler', 'QR-Code zu kurz. Bitte scannen Sie einen gültigen Mitglieds-QR-Code.');
        setScanned(false);
        setIsProcessing(false);
        return;
      }

      // Token validieren
      const validation = await validateToken(data);
      
      if (!validation.valid) {
        Alert.alert(
          'Ungültiger QR-Code', 
          validation.message || 'Dieser QR-Code ist nicht autorisiert.',
          [
            {
              text: 'OK',
              onPress: () => {
                setScanned(false);
                setIsProcessing(false);
              }
            }
          ]
        );
        return;
      }

      // Token und ggf. Benutzerdaten speichern
      await SecureStore.setItemAsync('userToken', data);
      
      if (validation.userData) {
        await SecureStore.setItemAsync('userData', JSON.stringify(validation.userData));
      }
      
      Alert.alert(
        'Erfolg', 
        `Willkommen${validation.userData?.name ? ', ' + validation.userData.name : ''}! Sie wurden erfolgreich authentifiziert.`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error during authentication:', error);
      Alert.alert('Fehler', 'Authentifizierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
      setScanned(false);
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.processingText}>Validiere QR-Code...</Text>
        <Text style={styles.subText}>Verbinde mit Server...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isFocused && (
        <CameraView 
          style={styles.camera} 
          barCodeScannerSettings={{
            barCodeTypes: ['qr'],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
      )}
      
      <View style={styles.overlay}>
        <View style={styles.topOverlay}>
          <Text style={styles.instructionText}>
            Scannen Sie Ihren Mitglieds-QR-Code
          </Text>
          <Text style={styles.hintText}>
            Format: CANNA-XXXX-XXXXXXXX
          </Text>
        </View>
        
        <View style={styles.middleRow}>
          <View style={styles.sideOverlay} />
          <View style={styles.scanArea}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </View>
          <View style={styles.sideOverlay} />
        </View>
        
        <View style={styles.bottomOverlay}>
          {scanned && (
            <Button 
              title="Erneut scannen" 
              onPress={() => setScanned(false)} 
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  text: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    color: 'white',
  },
  processingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  subText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleRow: {
    flexDirection: 'row',
    height: 250,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanArea: {
    width: 250,
    height: 250,
  },
  instructionText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  hintText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 50,
    height: 50,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#007AFF',
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 50,
    height: 50,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#007AFF',
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 50,
    height: 50,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#007AFF',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 50,
    height: 50,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#007AFF',
  },
});