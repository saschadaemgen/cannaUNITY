import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/components/SplashScreen';

export default function App() {
  const [isShowingSplash, setIsShowingSplash] = useState(true);

  return (
    <View style={styles.container}>
      {/* StatusBar ohne backgroundColor */}
      <StatusBar style="light" />
      
      {/* Grüner Hintergrund für StatusBar-Bereich */}
      <View style={styles.statusBarBackground} />
      
      {isShowingSplash ? (
        <SplashScreen onAnimationComplete={() => setIsShowingSplash(false)} />
      ) : (
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2ECC40',
  },
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50, // Anpassen je nach Gerät
    backgroundColor: '#2ECC40',
    zIndex: -1,
  },
});