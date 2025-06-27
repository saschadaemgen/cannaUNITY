import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Button, 
  Alert, 
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
  Image
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import jsQR from 'jsqr';
import { theme } from '../styles/theme';

// WICHTIG: In einer echten App würde dies von Ihrer API kommen
const VALID_TOKEN_PATTERN = /^CANNA-\d{4}-[A-Z0-9]{8}$/;

export default function LoginScreen({ navigation }) {
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
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

  // Token-Validierung
  const validateToken = async (token) => {
    if (!VALID_TOKEN_PATTERN.test(token)) {
      return { valid: false, message: 'Ungültiges Token-Format' };
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        };
      }

      return { valid: false, message: 'Token nicht in der Datenbank gefunden' };
      
    } catch (error) {
      console.error('Validation error:', error);
      return { valid: false, message: 'Netzwerkfehler bei der Validierung' };
    }
  };

  const processToken = async (token) => {
    setIsProcessing(true);

    try {
      if (!token || token.length < 10) {
        Alert.alert('Fehler', 'Token zu kurz. Bitte geben Sie einen gültigen Token ein.');
        setIsProcessing(false);
        return;
      }

      const validation = await validateToken(token);
      
      if (!validation.valid) {
        Alert.alert(
          'Ungültiger Token', 
          validation.message || 'Dieser Token ist nicht autorisiert.',
          [
            {
              text: 'OK',
              onPress: () => {
                setScanned(false);
                setIsProcessing(false);
                setManualToken('');
              }
            }
          ]
        );
        return;
      }

      await SecureStore.setItemAsync('userToken', token);
      
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
              navigation.navigate('Home');
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

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || isProcessing) return;
    setScanned(true);
    await processToken(data);
  };

  const handleManualSubmit = async () => {
    if (!manualToken) {
      Alert.alert('Fehler', 'Bitte geben Sie einen Token ein.');
      return;
    }
    setShowManualInput(false);
    setSelectedImage(null);
    await processToken(manualToken.toUpperCase());
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: [ImagePicker.MediaType.Image], // Geändert von MediaTypeOptions
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled) {
        setShowManualInput(false);
        setIsProcessing(true);
        setSelectedImage(result.assets[0].uri);
        
        try {
          // Bild manipulieren für bessere QR-Code-Erkennung
          const manipResult = await ImageManipulator.manipulateAsync(
            result.assets[0].uri,
            [{ resize: { width: 1000 } }],
            { compress: 1, format: ImageManipulator.SaveFormat.PNG, base64: true }
          );

          // QR-Code mit jsQR scannen
          // In React Native müssen wir die Base64-Daten anders verarbeiten
          const response = await fetch(`data:image/png;base64,${manipResult.base64}`);
          const blob = await response.blob();
          
          // Alternative Methode für React Native
          Alert.alert(
            'QR-Code aus Bild',
            'Die QR-Code-Erkennung aus Bildern ist in der aktuellen Version noch nicht vollständig implementiert. Bitte geben Sie den Token manuell ein.',
            [
              {
                text: 'Token eingeben',
                onPress: () => {
                  setIsProcessing(false);
                  setShowManualInput(true);
                  // Bild bleibt ausgewählt für manuelle Eingabe
                }
              },
              {
                text: 'Abbrechen',
                onPress: () => {
                  setIsProcessing(false);
                  setSelectedImage(null);
                }
              }
            ]
          );
        } catch (decodeError) {
          console.error('QR decode error:', decodeError);
          Alert.alert(
            'Fehler',
            'Der QR-Code konnte nicht gelesen werden. Bitte geben Sie den Token manuell ein.',
            [
              {
                text: 'Token eingeben',
                onPress: () => {
                  setIsProcessing(false);
                  setShowManualInput(true);
                }
              },
              {
                text: 'Abbrechen',
                onPress: () => {
                  setIsProcessing(false);
                  setSelectedImage(null);
                }
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Fehler', 'Bild konnte nicht geladen werden.');
      setIsProcessing(false);
    }
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Wir benötigen Ihre Erlaubnis, um die Kamera für den QR-Code Scanner zu verwenden</Text>
        <Button onPress={requestPermission} title="Erlaubnis erteilen" />
        <TouchableOpacity 
          style={styles.alternativeButton}
          onPress={() => setShowManualInput(true)}
        >
          <Text style={styles.alternativeButtonText}>Token manuell eingeben</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isProcessing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.processingText}>Validiere Token...</Text>
        <Text style={styles.subText}>Verbinde mit Server...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isFocused && !showManualInput && (
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
          
          <View style={styles.alternativeOptions}>
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => setShowManualInput(true)}
            >
              <Ionicons name="keypad-outline" size={24} color="white" />
              <Text style={styles.optionButtonText}>Manuell eingeben</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={pickImage}
            >
              <Ionicons name="image-outline" size={24} color="white" />
              <Text style={styles.optionButtonText}>Bild hochladen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Modal für manuelle Eingabe */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showManualInput}
        onRequestClose={() => {
          setShowManualInput(false);
          setSelectedImage(null);
          setManualToken('');
        }}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Token manuell eingeben</Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowManualInput(false);
                  setManualToken('');
                  setSelectedImage(null);
                }}
              >
                <Ionicons name="close" size={28} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {selectedImage && (
                <View style={styles.imagePreviewContainer}>
                  <Image 
                    source={{ uri: selectedImage }} 
                    style={styles.imagePreview} 
                    resizeMode="contain"
                  />
                  <Text style={styles.imageHint}>
                    Schauen Sie sich den QR-Code im Bild an und geben Sie den Token unten ein
                  </Text>
                  <TouchableOpacity 
                    style={styles.changeImageButton}
                    onPress={pickImage}
                  >
                    <Text style={styles.changeImageButtonText}>Anderes Bild wählen</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.modalDescription}>
                {selectedImage 
                  ? 'Geben Sie den Token aus dem QR-Code ein:'
                  : 'Geben Sie Ihren Mitglieds-Token ein. Der Token sollte das Format CANNA-XXXX-XXXXXXXX haben.'
                }
              </Text>

              <TextInput
                style={styles.tokenInput}
                placeholder="CANNA-2024-ABCD1234"
                placeholderTextColor={theme.colors.textLight}
                value={manualToken}
                onChangeText={setManualToken}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={19}
              />

              <TouchableOpacity 
                style={[styles.submitButton, !manualToken && styles.submitButtonDisabled]}
                onPress={handleManualSubmit}
                disabled={!manualToken}
              >
                <Text style={styles.submitButtonText}>Token verwenden</Text>
              </TouchableOpacity>

              {!selectedImage && (
                <>
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>ODER</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <TouchableOpacity 
                    style={styles.uploadButton}
                    onPress={pickImage}
                  >
                    <Ionicons name="cloud-upload-outline" size={24} color={theme.colors.primary} />
                    <Text style={styles.uploadButtonText}>QR-Code Bild hochladen</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    color: theme.colors.primary,
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
    borderColor: theme.colors.primary,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 50,
    height: 50,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: theme.colors.primary,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 50,
    height: 50,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: theme.colors.primary,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 50,
    height: 50,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: theme.colors.primary,
  },
  alternativeOptions: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 15,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  optionButtonText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 8,
  },
  alternativeButton: {
    marginTop: 20,
    padding: 10,
  },
  alternativeButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: '50%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  modalDescription: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 30,
    lineHeight: 24,
  },
  tokenInput: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 12,
    padding: 15,
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    textAlign: 'center',
    letterSpacing: 2,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.textLight,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    marginHorizontal: 15,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    backgroundColor: 'transparent',
  },
  uploadButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  imagePreviewContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    marginBottom: 10,
  },
  imageHint: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  changeImageButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changeImageButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});