// Dateiname: src/layout/TopbarMenuItems.jsx

import React from 'react';
import GroupsIcon from '@mui/icons-material/Groups';
import TimelineIcon from '@mui/icons-material/Timeline';
import PaymentsIcon from '@mui/icons-material/Payments';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import GrassIcon from '@mui/icons-material/Grass';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import ScienceIcon from '@mui/icons-material/Science';
import BiotechIcon from '@mui/icons-material/Biotech';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import BusinessIcon from '@mui/icons-material/Business';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CategoryIcon from '@mui/icons-material/Category';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import SecurityIcon from '@mui/icons-material/Security';
import SensorsIcon from '@mui/icons-material/Sensors';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import DescriptionIcon from '@mui/icons-material/Description';
import DashboardIcon from '@mui/icons-material/Dashboard';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SchoolIcon from '@mui/icons-material/School';
import ForumIcon from '@mui/icons-material/Forum';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import AssignmentIcon from '@mui/icons-material/Assignment';
import VideoCameraFrontIcon from '@mui/icons-material/VideoCameraFront';
import GavelIcon from '@mui/icons-material/Gavel';

// Definierte Menüstruktur mit allen Hauptmenüs und Untermenüs
const TopbarMenuItems = [
  {
    id: 'showCommunity', 
    label: 'Gemeinschaftsnetzwerk', 
    icon: <GroupsIcon />,
    children: [
      { 
        label: 'Mitgliederliste', 
        path: '/mitglieder', 
        icon: <GroupsIcon />,
        subtitle: 'Übersicht aller Netzwerkmitglieder'
      },
      { 
        label: 'Online Versammlungen', 
        path: '/versammlungen', 
        icon: <VideoCameraFrontIcon />,
        subtitle: 'Videokonferenzen und virtuelle Treffen'
      },
      { 
        label: 'Online Abstimmungen', 
        path: '/abstimmungen', 
        icon: <HowToVoteIcon />,
        subtitle: 'Demokratische Entscheidungsprozesse'
      },
      { 
        label: 'Aufgabenverwaltung', 
        path: 'taskmanager/', 
        icon: <AssignmentIcon />,
        subtitle: 'Projekte und Aufgabenverteilung'
      },
      { 
        label: 'Fortbildungen', 
        path: '/fortbildungen', 
        icon: <SchoolIcon />,
        subtitle: 'Weiterbildungsangebote und Kurse'
      },
      { 
        label: 'Nachrichtenzentrum', 
        path: '/nachrichten', 
        icon: <ForumIcon />,
        subtitle: 'Interne Kommunikationsplattform'
      },
      { 
        label: 'Beschlüsse', 
        path: '/beschluesse', 
        icon: <GavelIcon />,
        subtitle: 'Dokumentation gemeinschaftlicher Entscheidungen'
      }
    ]
  },
  {
    id: 'showGrowControl',
    label: 'Grow Control', 
    icon: <MonitorHeartIcon />,
    children: [
      { 
        label: 'S7 Grow Controller', 
        path: '/controller', 
        icon: <DashboardIcon />,
        subtitle: 'Zentrale Steuerungsübersicht'
      },
      { 
        label: 'Raumliste', 
        path: '/rooms', 
        icon: <CategoryIcon />,
        subtitle: 'Übersicht aller verfügbaren Räume'
      },
      { 
        label: 'Elemente-Bibliothek', 
        path: '/rooms/item-types', 
        icon: <CategoryIcon />,
        subtitle: 'Verwaltung der Raumelemente'
      },
      { 
        label: 'Raumdesigner', 
        path: '/rooms', 
        icon: <DashboardCustomizeIcon />, 
        subtitle: 'Wähle zuerst einen Raum aus der Liste' 
      }
    ]
  },
  {
    id: 'showTrackTrace', 
    label: 'Track & Trace', 
    icon: <TimelineIcon />, 
    children: [
      { 
        label: 'Step 1 - Sameneinkauf', 
        path: '/trace/samen', 
        icon: <GrassIcon />,
        subtitle: 'Ausgangsmaterial'
      },
      { 
        label: 'Step 2 - Mutterpflanzen', 
        path: '/trace/mutterpflanzen', 
        icon: <LocalFloristIcon />,
        subtitle: 'überführt aus Samen'
      },
      { 
        label: 'Step 3 - Stecklinge', 
        path: '/trace/stecklinge', 
        icon: <ContentCutIcon />,
        subtitle: 'überführt aus Stecklingen'
      },
      { 
        label: 'Step 4a - Blühpflanzen', 
        path: '/trace/bluehpflanzen', 
        icon: <AcUnitIcon />,
        subtitle: 'überführt aus Samen'
      },
      { 
        label: 'Step 4b - Blühpflanzen', 
        path: '/trace/bluehpflanzen-aus-stecklingen', 
        icon: <LocalFloristIcon />,
        subtitle: 'überführt aus Stecklingen'
      },
      { 
        label: 'Step 5 - Ernte', 
        path: '/trace/ernte', 
        icon: <AgricultureIcon />,
        subtitle: 'überführt aus Blühpflanzen'
      },
      { 
        label: 'Step 6 - Trocknung', 
        path: '/trace/trocknung', 
        icon: <AcUnitIcon />,
        subtitle: 'überführt aus Ernte'
      },
      { 
        label: 'Step 7 - Verarbeitung', 
        path: '/trace/verarbeitung', 
        icon: <ScienceIcon />,
        subtitle: 'überführt aus Trocknung'
      },
      { 
        label: 'Step 8 - Laborkontrolle', 
        path: '/trace/laborkontrolle', 
        icon: <BiotechIcon />,
        subtitle: 'überführt aus Verarbeitung'
      },
      { 
        label: 'Step 9 - Verpackung', 
        path: '/trace/verpackung', 
        icon: <Inventory2Icon />,
        subtitle: 'überführt aus Laborkontrolle'
      },
      { 
        label: 'Step 10 - Produktausgabe', 
        path: '/trace/ausgabe', 
        icon: <ShoppingBasketIcon />,
        subtitle: 'überführt aus Verpackung'
      },
      // Neue Admin-Funktionen (ohne Trenner im Top-Menü)
      { 
        label: 'Produktscan', 
        path: '/trace/produktscan', 
        icon: <QrCode2Icon />,
        subtitle: 'Rückverfolgung per QR/Barcode'
      },
      { 
        label: 'Protokoll-Exporte', 
        path: '/trace/protokolle', 
        icon: <DescriptionIcon />,
        subtitle: 'Berichte und Dokumentation'
      },
      { 
        label: 'Monitoring', 
        path: '/trace/monitoring', 
        icon: <DashboardIcon />,
        subtitle: 'Echtzeit-Überwachung'
      },
      { 
        label: 'Compliance', 
        path: '/trace/compliance', 
        icon: <VerifiedUserIcon />,
        subtitle: 'Behördliche Anforderungen'
      }
    ]
  },
  {
    id: 'showSecurity', 
    label: 'Sicherheit', 
    icon: <VpnKeyIcon />,
    children: [
      { 
        label: 'Zugangskontrolle', 
        path: '/unifi-access/dashboard', 
        icon: <SecurityIcon />,
        subtitle: 'Zugriffsverwaltung und Protokollierung'
      },
      { 
        label: 'Sensoren', 
        path: '/unifi-protect/sensoren', 
        icon: <SensorsIcon />,
        subtitle: 'Sensorüberwachung und Statusberichte'
      }
    ]
  },
  {
    id: 'showWawi',
    label: 'WaWi', 
    icon: <StorefrontIcon />, 
    children: [
      { 
        label: 'Cannabis-Sorten', 
        path: '/wawi/strains',
        icon: <GrassIcon />,
        subtitle: 'Verwaltung der Samenbestände'
      },
    ]
  },
  {
    id: 'showFinance',
    label: 'Buchhaltung', 
    icon: <PaymentsIcon />, 
    children: [
      { 
        label: 'Dashboard', 
        path: '/buchhaltung', 
        icon: <PaymentsIcon />,
        subtitle: 'Finanzübersicht und Kennzahlen'
      },
      { 
        label: 'Kontenübersicht', 
        path: '/buchhaltung/konten', 
        icon: <CategoryIcon />,
        subtitle: 'Verwaltung der Finanzkonten'
      },
      { 
        label: 'Buchungsjournal', 
        path: '/buchhaltung/journal', 
        icon: <TimelineIcon />,
        subtitle: 'Übersicht aller Buchungsvorgänge'
      },
      { 
        label: 'GuV', 
        path: '/buchhaltung/guv', 
        icon: <TimelineIcon />,
        subtitle: 'Gewinn- und Verlustrechnung'
      },
      { 
        label: 'Bilanz', 
        path: '/buchhaltung/bilanz', 
        icon: <BusinessIcon />,
        subtitle: 'Aktiva- und Passiva-Übersicht'
      },
      { 
        label: 'Jahresabschluss', 
        path: '/buchhaltung/jahresabschluss', 
        icon: <TimelineIcon />,
        subtitle: 'Erstellung des Jahresabschlusses'
      }
    ]
  },
  {
    id: 'showReports',
    label: 'Berichte', 
    icon: <AssessmentIcon />,
    children: [
      { 
        label: 'Laborberichte', 
        path: '/laborreports', 
        icon: <BiotechIcon />,
        subtitle: 'Laboranalysen und Qualitätskontrollen'
      }
    ]
  }
];

export default TopbarMenuItems;