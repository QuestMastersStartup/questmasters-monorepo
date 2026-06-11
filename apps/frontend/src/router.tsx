import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { Library } from "./pages/Library";
import { Marketplace } from "./pages/Marketplace";
import { CreatePack } from "./pages/CreatePack";
import { PackDetails } from "./pages/PackDetails";
import { EditPack } from "./pages/EditPack";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import Profile from './pages/Profile';
import { Campaigns } from "./pages/Campaigns";
import { CreateCampaign } from "./pages/CreateCampaign";
import { CampaignDetails } from "./pages/CampaignDetails";
import { EditCampaign } from "./pages/EditCampaign";
import { CreateCharacter } from "./pages/CreateCharacter";
import { CharacterDetail } from "./pages/CharacterDetail";
import { Characters } from "./pages/Characters";
import { DmSessions } from "./pages/DmSessions";
import { DmSession } from "./pages/DmSession";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/marketplace" replace />,
      },
      {
        path: "campaigns",
        children: [
          {
            index: true,
            element: <ProtectedRoute><Campaigns /></ProtectedRoute>,
          },
          {
            path: "create",
            element: <ProtectedRoute><CreateCampaign /></ProtectedRoute>,
          },
          {
            path: ":id",
            element: <ProtectedRoute><CampaignDetails /></ProtectedRoute>,
          },
          {
            path: ":id/edit",
            element: <ProtectedRoute><EditCampaign /></ProtectedRoute>,
          },
          {
            path: ":id/characters/create",
            element: <ProtectedRoute><CreateCharacter /></ProtectedRoute>,
          },
          {
            path: ":id/characters/:charId/edit",
            element: <ProtectedRoute><CreateCharacter /></ProtectedRoute>,
          }
        ],
      },
      {
        path: "characters",
        children: [
          {
            index: true,
            element: <ProtectedRoute><Characters /></ProtectedRoute>,
          },
          {
            path: "create",
            element: <ProtectedRoute><CreateCharacter /></ProtectedRoute>,
          },
          {
            path: ":charId",
            element: <ProtectedRoute><CharacterDetail /></ProtectedRoute>,
          },
          {
            path: ":charId/edit",
            element: <ProtectedRoute><CreateCharacter /></ProtectedRoute>,
          },
        ]
      },
      {
        path: "dm-sessions",
        children: [
          {
            index: true,
            element: <ProtectedRoute><DmSessions /></ProtectedRoute>,
          },
          {
            path: ":id",
            element: <ProtectedRoute><DmSession /></ProtectedRoute>,
          },
        ],
      },
      {
        path: "library",
        children: [
          {
            index: true,
            element: <Library />,
          },
          {
            path: "create",
            element: <ProtectedRoute><CreatePack /></ProtectedRoute>,
          },
          {
            path: ":slug",
            element: <PackDetails />,
          },
          {
            path: ":slug/edit",
            element: <ProtectedRoute><EditPack /></ProtectedRoute>,
          },
        ],
      },
      {
        path: "marketplace",
        element: <Marketplace />,
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: "*",
        element: <Navigate to="/marketplace" replace />,
      },
    ],
  },
]);
