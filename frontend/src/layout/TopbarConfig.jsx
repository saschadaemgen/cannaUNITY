// Dateiname: src/layout/TopbarConfig.jsx

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
  };
  
  // Demo-Daten für die verschiedenen Menübereiche
  export const traceData = {
    'Step 1 - Samen': { 
      transferred: 0, 
      total: 100, 
      co2: 452, 
      dust: 16, 
      statusMsg: 'Keimung läuft planmäßig (Demo)', 
      status: 'normal', 
      overdue: false,
      subtitle: 'Ausgangsmaterial'
    },
    'Step 2 - Mutterpflanzen': { 
      transferred: 10, 
      total: 120, 
      co2: 387, 
      dust: 19, 
      statusMsg: 'Wachstum regulär (Demo)', 
      status: 'normal', 
      overdue: false,
      subtitle: 'überführt aus Samen'
    },
    'Step 3 - Stecklinge': { 
      transferred: 15, 
      total: 130, 
      co2: 493, 
      dust: 12, 
      statusMsg: 'Bewurzelung aktiv (Demo)', 
      status: 'normal', 
      overdue: false,
      subtitle: 'überführt aus Mutterpflanzen'
    },
    'Step 4a - Blühpflanzen': { 
      transferred: 5, 
      total: 90, 
      co2: 412, 
      dust: 18, 
      statusMsg: 'Düngemittel niedrig (Demo)', 
      status: 'warning', 
      overdue: false, 
      subtitle: 'überführt aus Samen' 
    },
    'Step 4b - Blühpflanzen': { 
      transferred: 8, 
      total: 85, 
      co2: 405, 
      dust: 14, 
      statusMsg: 'Wachstum optimal (Demo)', 
      status: 'normal', 
      overdue: false, 
      subtitle: 'überführt aus Stecklingen' 
    },
    'Step 5 - Ernte': { 
      transferred: 0, 
      total: 85, 
      co2: 423, 
      dust: 15, 
      statusMsg: 'Zwei Ernten überfällig! (Demo)', 
      status: 'error', 
      overdue: true,
      subtitle: 'überführt aus Blühpflanzen'
    },
    'Step 6 - Trocknung': { 
      transferred: 8, 
      total: 100, 
      co2: 436, 
      dust: 18, 
      statusMsg: 'Feuchtewerte im Zielbereich (Demo)', 
      status: 'normal', 
      overdue: false,
      subtitle: 'überführt aus Ernte'
    },
    'Step 7 - Verarbeitung': { 
      transferred: 12, 
      total: 110, 
      co2: 347, 
      dust: 11, 
      statusMsg: 'Parameter kontrolliert (Demo)', 
      status: 'normal', 
      overdue: false,
      subtitle: 'überführt aus Trocknung'
    },
    'Step 8 - Laborkontrolle': { 
      transferred: 9, 
      total: 95, 
      co2: 298, 
      dust: 17, 
      statusMsg: 'Tests laufen planmäßig (Demo)', 
      status: 'normal', 
      overdue: false,
      subtitle: 'überführt aus Verarbeitung'
    },
    'Step 9 - Verpackung': { 
      transferred: 7, 
      total: 100, 
      co2: 362, 
      dust: 14, 
      statusMsg: 'Vorrat niedrig (Demo)', 
      status: 'warning', 
      overdue: false,
      subtitle: 'überführt aus Laborkontrolle'
    },
    'Step 10 - Produktausgabe': { 
      transferred: 14, 
      total: 120, 
      co2: 428, 
      dust: 9, 
      statusMsg: 'Ausgabe im Zeitplan (Demo)', 
      status: 'normal', 
      overdue: false,
      subtitle: 'überführt aus Verpackung'
    }
  };
  
  // Finance-Demodaten mit einheitlichen Beschreibungen
  export const financeData = {
    Dashboard: { 
      period: '01.01.2025 – 30.04.2025 (Demo)', 
      info: 'Übersichtliche Darstellung aller relevanten Finanzdaten und Kennzahlen des Systems.'
    },
    'Kontenübersicht': { 
      accounts: 5, 
      balance: 243500,
      info: 'Verwaltung und Einsicht aller Finanzkonten mit aktuellen Salden und Transaktionshistorie.'
    },
    'Neues Konto': { 
      createdThisPeriod: 1, 
      accountName: 'Rücklagen (Demo)', 
      creationDate: '15.04.2025',
      info: 'Erstellung und Konfiguration eines neuen Finanzkontos mit individuellen Einstellungen.'
    },
    'Buchungsjournal': { 
      entries: 278, 
      pendingEntries: 4, 
      lastJournalEntry: '29.04.2025',
      info: 'Chronologische Aufzeichnung aller Buchungsvorgänge mit detaillierten Informationen.'
    },
    'Neue Buchung': { 
      drafts: 2, 
      lastDraft: '30.04.2025',
      info: 'Erfassung und Verarbeitung neuer Buchungsvorgänge mit automatischer Validierung.'
    },
    'GuV': { 
      revenue: 185000, 
      expenses: 112500, 
      profit: 72500, 
      period: '01.01.2025 – 30.04.2025 (Demo)',
      info: 'Detaillierte Gewinn- und Verlustrechnung mit periodenbezogenen Auswertungen.'
    },
    'Bilanz': { 
      equity: 180000,
      info: 'Vollständige Bilanzübersicht mit Aktiva und Passiva sowie relevanten Kennzahlen.'
    },
    'Jahresabschluss': { 
      closingDate: '31.12.2024 (Demo)',
      info: 'Erstellung und Verwaltung des jährlichen Rechnungsabschlusses nach gesetzlichen Vorgaben.'
    }
  };
  
  // WaWi-Demodaten
  export const wawiData = {
    'Samen-Verwaltung': { count: 25, pending: 3, status: 'Aktiv (Demo)', lastUpdate: '19.04.2025' },
    'Hersteller-Verwaltung': { count: 12, pending: 2, status: 'Aktiv (Demo)', lastUpdate: '18.04.2025' }
  };
  
  // Demodaten für das Sicherheitsmenü
  export const securityData = {
    'Zugangskontrolle': { activeUsers: 14, lastAccess: '01.05.2025', alertLevel: 'normal', status: 'Aktiv (Demo)' },
    'Sensoren': { activeDevices: 28, alertCount: 0, batteryStatus: 'Gut', lastCheck: '01.05.2025', status: 'Aktiv (Demo)' }
  };