import { createBrowserRouter } from 'react-router-dom'

import MainLayout from '../layout/MainLayout'
import Home from '../apps/members/pages/Home'

// Member-Komponenten
import MemberList from '../apps/members/pages/MemberList'

// Rooms-Komponenten
import RoomList from "../apps/rooms/pages/RoomList"
import RoomDetail from "../apps/rooms/pages/RoomDetail"
import RoomCreate from "../apps/rooms/pages/RoomCreate"
import RoomEdit from "../apps/rooms/pages/RoomEdit"
import RoomDelete from "../apps/rooms/pages/RoomDelete"

// Login-Komponente
import Login from '../pages/Login'

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

      // Platzhalter
      { path: 'netzwerk', element: <div>Gemeinschaftsnetzwerk</div> },
      { path: 'trace', element: <div>Track & Trace</div> },
      { path: 'buchhaltung', element: <div>Buchhaltung</div> },
      { path: 'bereiche', element: <div>Bereichsmanagement</div> },
      { path: 'zutritt', element: <div>Zutrittskontrolle</div> },
    ],
  },

  // Login (ohne MainLayout)
  {
    path: '/login',
    element: <Login />,
  },
])
