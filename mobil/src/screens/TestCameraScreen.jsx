import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as SecureStore from 'expo-secure-store';

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

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || isProcessing) return;
    
    setScanned(true);
    setIsProcessing(true);

    try {
      if (!data || data.length < 10) {
        Alert.alert('Fehler', 'Ungültiger QR-Code. Bitte versuchen Sie es erneut.');
        setScanned(false);
        setIsProcessing(false);
        return;
      }

      await SecureStore.setItemAsync('userToken', data);
      
      Alert.alert(
        'Erfolg', 
        'QR-Code erfolgreich gescannt und Token gespeichert!',
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
      console.error('Error saving token:', error);
      Alert.alert('Fehler', 'Token konnte nicht gespeichert werden.');
      setScanned(false);
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.processingText}>Verarbeite QR-Code...</Text>
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
            Richten Sie die Kamera auf einen QR-Code
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
  },
  camera: {
    flex: 1,
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
    fontSize: 16,
    color: '#007AFF',
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
    marginBottom: 20,
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