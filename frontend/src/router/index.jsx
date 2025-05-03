import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '../layout/MainLayout'
import Home from '../apps/members/pages/Home'
import MemberList from '../apps/members/pages/MemberList'
import RoomList from "../apps/rooms/pages/RoomList"
import RoomDetail from "../apps/rooms/pages/RoomDetail"
import RoomCreate from "../apps/rooms/pages/RoomCreate"
import RoomEdit from "../apps/rooms/pages/RoomEdit"
import RoomDelete from "../apps/rooms/pages/RoomDelete"
import RoomItemTypeList from '../apps/rooms/pages/RoomItemTypeList'
import RoomItemTypeCreate from '../apps/rooms/pages/RoomItemTypeCreate'
import RoomItemTypeEdit from '../apps/rooms/pages/RoomItemTypeEdit'
import RoomDesignerPage from '../apps/rooms/pages/RoomDesignerPage'
import Login from '../pages/Login'
import Dashboard from '../apps/unifi_access/pages/Dashboard'
import OptionsDashboard from '../apps/options/pages/OptionsDashboard'
import BuchhaltungDashboard from '../apps/buchhaltung/pages/Dashboard'
import AccountList from '../apps/buchhaltung/pages/AccountList'
import AccountForm from '../apps/buchhaltung/pages/AccountForm'
import AccountImport from '../apps/buchhaltung/pages/AccountImport'
import JournalList from '../apps/buchhaltung/pages/JournalList'
import BookingForm from '../apps/buchhaltung/pages/BookingForm'
import BookingDetail from '../apps/buchhaltung/pages/BookingDetail'
import MainBook from '../apps/buchhaltung/pages/MainBook'
import ProfitLoss from '../apps/buchhaltung/pages/ProfitLoss'
import BalanceSheet from '../apps/buchhaltung/pages/BalanceSheet'
import YearClosingList from '../apps/buchhaltung/pages/YearClosingList'
import YearClosingPrep from '../apps/buchhaltung/pages/YearClosingPrep'
import MemberCreate from '../apps/members/pages/MemberCreate'
import MemberEdit from '../apps/members/pages/MemberEdit'
import MemberDelete from '../apps/members/pages/MemberDelete'
import SeedPurchasePage from '../apps/trackandtrace/pages/SeedPurchase/SeedPurchasePage';
import MotherPlantPage from '../apps/trackandtrace/pages/MotherPlant/MotherPlantPage';
import FloweringPlantPage from '../apps/trackandtrace/pages/FloweringPlant/FloweringPlantPage';
import CuttingPage from '../apps/trackandtrace/pages/Cutting/CuttingPage';
import BloomingCuttingPlantPage from '../apps/trackandtrace/pages/BloomingCuttingPlant/BloomingCuttingPlantPage';
import ProtectSensorPage from '../apps/unifi_protect/pages/ProtectSensorPage';
import HarvestPage from '../apps/trackandtrace/pages/Harvest/HarvestPage';
import DryingPage from '../apps/trackandtrace/pages/Drying/DryingPage';
import ProcessingPage from '../apps/trackandtrace/pages/Processing/ProcessingPage';
import LabTestingPage from '../apps/trackandtrace/pages/LabTesting/LabTestingPage';
import PackagingPage from '../apps/trackandtrace/pages/Packaging/PackagingPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: '', element: <Home /> },

      // Mitglieder
      { path: 'mitglieder', element: <MemberList /> },
      { path: 'mitglieder/:id/edit', element: <MemberEdit /> },
      { path: 'mitglieder/:id/delete', element: <MemberDelete /> },
      { path: 'mitglieder/neu', element: <MemberCreate /> },

      // Räume
      { path: 'rooms', element: <RoomList /> },
      { path: 'rooms/new', element: <RoomCreate /> },
      { path: 'rooms/:id', element: <RoomDetail /> },
      { path: 'rooms/:id/edit', element: <RoomEdit /> },
      { path: 'rooms/:id/delete', element: <RoomDelete /> },
      { path: 'rooms/:id/designer', element: <RoomDesignerPage /> },

      // Raumelement-Typen
      { path: 'rooms/item-types', element: <RoomItemTypeList /> },
      { path: 'rooms/item-types/new', element: <RoomItemTypeCreate /> },
      { path: 'rooms/item-types/:id/edit', element: <RoomItemTypeEdit /> },

      // Dashboards
      { path: 'unifi-access', element: <Dashboard /> },
      { path: 'unifi-access/dashboard', element: <Dashboard /> },
      { path: 'options', element: <OptionsDashboard /> },

      // Buchhaltung
      { path: 'buchhaltung', element: <BuchhaltungDashboard /> },
      { path: 'buchhaltung/konten', element: <AccountList /> },
      { path: 'buchhaltung/konten/neu', element: <AccountForm /> },
      { path: 'buchhaltung/konten/:id/edit', element: <AccountForm /> },
      { path: 'buchhaltung/konten/import', element: <AccountImport /> },
      { path: 'buchhaltung/journal', element: <JournalList /> },
      { path: 'buchhaltung/buchung/neu', element: <BookingForm /> },
      { path: 'buchhaltung/buchung/:id', element: <BookingDetail /> },
      { path: 'buchhaltung/hauptbuch', element: <MainBook /> },
      { path: 'buchhaltung/guv', element: <ProfitLoss /> },
      { path: 'buchhaltung/bilanz', element: <BalanceSheet /> },
      { path: 'buchhaltung/jahresabschluss', element: <YearClosingList /> },
      { path: 'buchhaltung/jahresabschluss/:id/vorbereitung', element: <YearClosingPrep /> },

      //Track and Trace
      { path: 'trace', element: <div>Track & Trace</div> },
      { path: 'trace/samen', element: <SeedPurchasePage /> },
      { path: 'trace/mutterpflanzen', element: <MotherPlantPage /> },
      { path: 'trace/stecklinge', element: <CuttingPage /> },
      { path: 'trace/bluehpflanzen', element: <FloweringPlantPage /> },
      { path: 'trace/bluehpflanzen-aus-stecklingen', element: <BloomingCuttingPlantPage /> },
      { path: 'trace/ernte', element: <HarvestPage /> },
      { path: 'trace/trocknung', element: <DryingPage /> },
      { path: 'trace/verarbeitung', element: <ProcessingPage /> },
      { path: 'trace/laborkontrolle', element: <LabTestingPage /> },
      { path: 'trace/verpackung', element: <PackagingPage /> },

      // Sicherheit
      { path: 'unifi-protect/sensoren', element: <ProtectSensorPage /> },

      // Optional: zukünftige Seiten
      { path: 'netzwerk', element: <div>Gemeinschaftsnetzwerk</div> },
    ],
  },

  {
    path: '/login',
    element: <Login />,
  },
])