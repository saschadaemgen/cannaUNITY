import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

export default function PlaceholderScreen({ route }) {
  const screenName = route?.name || 'Demo Screen';
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name="construct-outline" 
            size={80} 
            color={theme.colors.primary} 
          />
        </View>
        
        <Text style={styles.title}>{screenName}</Text>
        <Text style={styles.subtitle}>In Entwicklung</Text>
        
        <View style={styles.infoBox}>
          <Ionicons 
            name="information-circle" 
            size={24} 
            color={theme.colors.info} 
          />
          <Text style={styles.infoText}>
            Diese Seite befindet sich noch in der Entwicklung und wird in Kürze verfügbar sein.
          </Text>
        </View>
        
        <Text style={styles.description}>
          Wir arbeiten daran, Ihnen die beste Erfahrung zu bieten. 
          Vielen Dank für Ihre Geduld!
        </Text>
        
        <View style={styles.featuresBox}>
          <Text style={styles.featuresTitle}>Geplante Funktionen:</Text>
          <Text style={styles.featureItem}>• Vollständige Integration</Text>
          <Text style={styles.featureItem}>• Benutzerfreundliche Oberfläche</Text>
          <Text style={styles.featureItem}>• Erweiterte Funktionalität</Text>
          <Text style={styles.featureItem}>• Echtzeit-Updates</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xl,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: theme.colors.info + '15',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
    width: '100%',
  },
  infoText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  description: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
  featuresBox: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    width: '100%',
    ...theme.shadows.md,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  featureItem: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
});