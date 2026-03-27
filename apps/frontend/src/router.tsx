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
