import React, { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function DatabaseManagerPage() {
  const [_, navigate] = useLocation();
  
  // Redirect to the database-backup page
  useEffect(() => {
    navigate('/database-backup');
  }, [navigate]);
  
  // Simple loading state while we redirect
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting to database backup page...</p>
    </div>
  );
}