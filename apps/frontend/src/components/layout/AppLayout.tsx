import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background pointer-events-none z-0" />

      <Sidebar />

      <main className="pl-64 min-h-screen relative z-10">
        <div className="container py-8 px-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
