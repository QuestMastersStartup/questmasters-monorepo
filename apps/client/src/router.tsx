import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { Library } from "./pages/Library";
import { Marketplace } from "./pages/Marketplace";
import { CreatePack } from "./pages/CreatePack";
import { PackDetails } from "./pages/PackDetails";
import { EditPack } from "./pages/EditPack";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/library" replace />,
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
            element: <CreatePack />,
          },
          {
            path: ":slug",
            element: <PackDetails />,
          },
          {
            path: ":slug/edit",
            element: <EditPack />,
          },
        ],
      },
      {
        path: "marketplace",
        element: <Marketplace />,
      },
      {
        path: "*",
        element: <Navigate to="/library" replace />,
      },
    ],
  },
]);
