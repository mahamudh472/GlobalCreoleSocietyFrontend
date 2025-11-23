import React from 'react';
import { Navigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/queries';

const ProtectedRoute = ({ children }) => {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    // Show loading spinner while checking auth status
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/signin" replace />;
  }

  return children;
};

export default ProtectedRoute;
