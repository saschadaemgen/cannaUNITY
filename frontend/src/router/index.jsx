import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '../layout/MainLayout'
import Home from '../apps/members/pages/Home'
import MemberList from '../apps/members/pages/MemberList'
import RoomList from "../apps/rooms/pages/RoomList"
import RoomDetail from "../apps/rooms/pages/RoomDetail"
import RoomCreate from "../apps/rooms/pages/RoomCreate"
import RoomEdit from "../apps/rooms/pages/RoomEdit"
import RoomDelete from "../apps/rooms/pages/RoomDelete"
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

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: '', element: <Home /> },

      // Mitglieder
      { path: 'mitglieder', element: <MemberList /> },

      // Räume
      { path: 'rooms', element: <RoomList /> },
      { path: 'rooms/new', element: <RoomCreate /> },
      { path: 'rooms/:id', element: <RoomDetail /> },
      { path: 'rooms/:id/edit', element: <RoomEdit /> },
      { path: 'rooms/:id/delete', element: <RoomDelete /> },

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

      // Optional: zukünftige Seiten
      { path: 'netzwerk', element: <div>Gemeinschaftsnetzwerk</div> },
      { path: 'trace', element: <div>Track & Trace</div> },
    ],
  },

  {
    path: '/login',
    element: <Login />,
  },
])