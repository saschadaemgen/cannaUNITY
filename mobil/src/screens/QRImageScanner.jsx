import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

const { width, height } = Dimensions.get('window');

export default function QRImageScanner({ route, navigation }) {
  const { imageUri } = route.params;
  const [isScanning, setIsScanning] = useState(true);
  const [hasScanned, setHasScanned] = useState(false);

  useEffect(() => {
    scanImage();
  }, []);

  const scanImage = async () => {
    try {
      // Verwende BarCodeScanner um das Bild zu scannen
      const result = await BarCodeScanner.scanFromURLAsync(imageUri);
      
      if (result && result.length > 0) {
        setHasScanned(true);
        const qrData = result[0].data;
        
        // Navigiere zurück zum LoginScreen mit dem gescannten Token
        navigation.navigate('Login', { scannedToken: qrData });
      } else {
        Alert.alert(
          'Kein QR-Code gefunden',
          'Im ausgewählten Bild konnte kein QR-Code erkannt werden.',
          [
            {
              text: 'Neues Bild wählen',
              onPress: () => navigation.goBack()
            },
            {
              text: 'Manuell eingeben',
              onPress: () => navigation.navigate('Login', { showManualInput: true })
            }
          ]
        );
      }
    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert(
        'Fehler',
        'Das Bild konnte nicht gescannt werden.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>QR-Code aus Bild scannen</Text>
      </View>

      <View style={styles.content}>
        <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
        
        {isScanning && (
          <View style={styles.scanningOverlay}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.scanningText}>Suche QR-Code...</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.hint}>
          Tipp: Der QR-Code sollte gut sichtbar und nicht verzerrt sein.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'white',
    ...theme.shadows.sm,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewImage: {
    width: width - 40,
    height: height * 0.5,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  scanningOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  scanningText: {
    marginTop: 15,
    fontSize: 16,
    color: theme.colors.text,
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
  },
  hint: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});