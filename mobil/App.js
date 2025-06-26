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
      <StatusBar style="light" backgroundColor="#2ECC40" />
      
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
});