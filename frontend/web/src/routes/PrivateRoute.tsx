import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "../hooks/useSession";
import type { ReactNode } from "react";

interface PrivateRouteProps {
    children: ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
    const { session, loading } = useSession();
    const location = useLocation();

    if (loading) return <div className='flex justify-center items-center h-screen'>Loading...</div>;

    if (!session) {
        return <Navigate to='/sign-in' state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
