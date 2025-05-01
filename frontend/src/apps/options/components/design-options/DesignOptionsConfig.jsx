// src/options/components/design-options/DesignOptionsConfig.jsx

// Standardwerte für die Designoptionen
export const defaultDesignOptions = {
  // Topbar Titel
  title: 'cannaUNITY',
  titleFont: "'Roboto', sans-serif",
  titleWeight: 'bold',
  titleStyle: 'normal',
  titleDecoration: 'none',
  titleColor: '#ffffff',
  
  // Topbar und Menü
  topbarColor: 'success',
  menuFont: "'Roboto', sans-serif",
  menuWeight: 'normal',
  menuStyle: 'normal',
  menuDecoration: 'none',
  menuColor: '#ffffff',
  menuSpacing: 2, // Abstand zwischen Menüeinträgen (in MUI spacing units)
  
  // Divider
  showDividers: true,
  
  // Dark Mode
  darkMode: false,
  
  // Menü Sichtbarkeit
  menuVisibility: {
    showCommunity: true,
    showTrackTrace: true,
    showWawi: true,
    showFinance: true,
    showRooms: true,
    showSecurity: true,
  },
  
  // Footer Einstellungen
  footerMode: 'full', // 'full', 'title', 'none'
  
  // NEU: Animations-Einstellungen
  animations: {
    enabled: true,
    type: 'slide', // 'fade', 'slide', 'grow'
    duration: 500,
  },
  
  // NEU: Floating Bar Einstellungen (ohne Glow-Effekt)
  floatingBar: {
    enabled: true,
    height: 3,
    color: '#ffffff',
  },
};

// Google Fonts Auswahl - Erweitert mit aktuellen Fonts für 2025
export const googleFonts = [
  // Standard Sans-Serif Fonts
  { name: 'Roboto', family: "'Roboto', sans-serif" },
  { name: 'Open Sans', family: "'Open Sans', sans-serif" },
  { name: 'Montserrat', family: "'Montserrat', sans-serif" },
  { name: 'Lato', family: "'Lato', sans-serif" },
  { name: 'Poppins', family: "'Poppins', sans-serif" },
  { name: 'Oswald', family: "'Oswald', sans-serif" },
  { name: 'Raleway', family: "'Raleway', sans-serif" },
  { name: 'Source Sans Pro', family: "'Source Sans Pro', sans-serif" },
  { name: 'Ubuntu', family: "'Ubuntu', sans-serif" },
  { name: 'Nunito', family: "'Nunito', sans-serif" },
  { name: 'Quicksand', family: "'Quicksand', sans-serif" },
  { name: 'PT Sans', family: "'PT Sans', sans-serif" },
  { name: 'Fira Sans', family: "'Fira Sans', sans-serif" },
  
  // Elegante Serif Fonts
  { name: 'Playfair Display', family: "'Playfair Display', serif" },
  { name: 'Merriweather', family: "'Merriweather', serif" },
  { name: 'Libre Baskerville', family: "'Libre Baskerville', serif" },
  { name: 'Crimson Text', family: "'Crimson Text', serif" },
  { name: 'PT Serif', family: "'PT Serif', serif" },
  { name: 'Vidaloka', family: "'Vidaloka', serif" },
  { name: 'Fraunces', family: "'Fraunces', serif" },
  { name: 'Alegreya', family: "'Alegreya', serif" },
  
  // Moderne & Trendige Fonts
  { name: 'Inter', family: "'Inter', sans-serif" },
  { name: 'DM Sans', family: "'DM Sans', sans-serif" },
  { name: 'Work Sans', family: "'Work Sans', sans-serif" },
  { name: 'Archivo Narrow', family: "'Archivo Narrow', sans-serif" },
  { name: 'Barlow Condensed', family: "'Barlow Condensed', sans-serif" },
  { name: 'Karla', family: "'Karla', sans-serif" },
  { name: 'Rubik', family: "'Rubik', sans-serif" },
  
  // Auffällige Display Fonts
  { name: 'Bebas Neue', family: "'Bebas Neue', cursive" },
  { name: 'Anton', family: "'Anton', sans-serif" },
  { name: 'Abril Fatface', family: "'Abril Fatface', cursive" },
  { name: 'Rubik Mono One', family: "'Rubik Mono One', sans-serif" },
  { name: 'Bungee', family: "'Bungee', cursive" },
  { name: 'Russo One', family: "'Russo One', sans-serif" },
  
  // Handschriften & Script Fonts
  { name: 'Dancing Script', family: "'Dancing Script', cursive" },
  { name: 'Pacifico', family: "'Pacifico', cursive" },
  { name: 'Sacramento', family: "'Sacramento', cursive" },
  { name: 'Satisfy', family: "'Satisfy', cursive" },
  { name: 'Bad Script', family: "'Bad Script', cursive" },
  { name: 'Caveat', family: "'Caveat', cursive" },
  
  // Monospace Fonts
  { name: 'Roboto Mono', family: "'Roboto Mono', monospace" },
  { name: 'Source Code Pro', family: "'Source Code Pro', monospace" },
  { name: 'Space Mono', family: "'Space Mono', monospace" },
  { name: 'Fira Code', family: "'Fira Code', monospace" },
  { name: 'JetBrains Mono', family: "'JetBrains Mono', monospace" }
];

// Vordefinierte Farben
export const colorOptions = [
  { name: 'Weiß', value: '#ffffff' },
  { name: 'Gelb', value: '#ffeb3b' },
  { name: 'Orange', value: '#ff9800' },
  { name: 'Rot', value: '#f44336' },
  { name: 'Pink', value: '#e91e63' },
  { name: 'Lila', value: '#9c27b0' },
  { name: 'Blau', value: '#2196f3' },
  { name: 'Grün', value: '#4caf50' },
  { name: 'Türkis', value: '#009688' },
  { name: 'Schwarz', value: '#000000' },
];

// Material UI Themes
export const themeOptions = [
  { name: 'Grün (Standard)', value: 'success' },
  { name: 'Blau', value: 'primary' },
  { name: 'Rot', value: 'error' },
  { name: 'Lila', value: 'secondary' },
  { name: 'Orange', value: 'warning' },
  { name: 'Türkis', value: 'info' },
];

// Menüoptionen zum Ein-/Ausblenden
export const menuVisibilityOptions = [
  { id: 'showCommunity', label: 'Gemeinschaftsnetzwerk', defaultVisible: true },
  { id: 'showTrackTrace', label: 'Track & Trace', defaultVisible: true },
  { id: 'showWawi', label: 'WaWi', defaultVisible: true },
  { id: 'showFinance', label: 'Buchhaltung', defaultVisible: true },
  { id: 'showRooms', label: 'Raumverwaltung', defaultVisible: true },
  { id: 'showSecurity', label: 'Sicherheit', defaultVisible: true },
];

// Footer Optionen
export const footerOptions = [
  { id: 'showFullFooter', label: 'cannaUNITY mit Version anzeigen', value: 'full' },
  { id: 'showTitleOnly', label: 'Nur cannaUNITY anzeigen (ohne Version)', value: 'title' },
  { id: 'hideFooter', label: 'Keinen Titel anzeigen', value: 'none' },
];

// Animationstypen-Optionen
export const animationTypes = [
  { id: 'slide', label: 'Gleiten', description: '(Elemente gleiten von der Seite herein)' },
  { id: 'fade', label: 'Einblenden', description: '(Elemente blenden sanft ein und aus)' },
  { id: 'grow', label: 'Wachsen', description: '(Elemente wachsen beim Erscheinen)' },
];