import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

interface AuthActionGuardProps {
  children: React.ReactNode;
  fallbackMessage?: string;
}

export function AuthActionGuard({ children, fallbackMessage }: AuthActionGuardProps) {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) return null;

  if (isAuthenticated) {
    return <>{children}</>;
  }

  const handleIntercept = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Redirect to login with current location as "from" state
    navigate("/login", { 
      state: { 
        from: location,
        message: fallbackMessage || "Inicia sesión para realizar esta acción"
      } 
    });
  };

  return (
    <div onClickCapture={handleIntercept}>
      {children}
    </div>
  );
}
