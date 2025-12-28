import React from 'react';
import { Helmet } from 'react-helmet';
import { AuthProvider, useAuth } from '@/contexts/SupabaseAuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Toaster } from '@/components/ui/toaster';
import Dashboard from '@/components/Dashboard';
import Login from '@/components/Login';
import { Loader2 } from 'lucide-react';

// Wrapper component to handle auth state rendering
const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-500">Loading system...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <Dashboard />;
};

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Helmet>
          <title>School Management System</title>
          <meta name="description" content="A comprehensive student management system." />
        </Helmet>
        <div className="min-h-screen bg-slate-50 font-sans" dir="ltr">
          <AppContent />
        </div>
        <Toaster />
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;