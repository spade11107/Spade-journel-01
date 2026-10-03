import { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { AuthScreen } from '@/components/AuthScreen';
import { Layout, PageKey } from '@/components/Layout';
import { FullPageLoader } from '@/components/ui/States';
import { Dashboard } from '@/pages/Dashboard';
import { AddTrade } from '@/pages/AddTrade';
import { TradeJournal } from '@/pages/TradeJournal';
import { Calendar } from '@/pages/Calendar';
import { Analytics } from '@/pages/Analytics';
import { Psychology } from '@/pages/Psychology';
import { Mistakes } from '@/pages/Mistakes';
import { Accounts } from '@/pages/Accounts';
import { Settings } from '@/pages/Settings';

function AppContent() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState<PageKey>('dashboard');

  if (loading) {
    return <FullPageLoader message="Loading SPADE..." />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard onNavigate={setPage} />;
      case 'add-trade':
        return <AddTrade onNavigate={setPage} />;
      case 'journal':
        return <TradeJournal />;
      case 'calendar':
        return <Calendar />;
      case 'analytics':
        return <Analytics />;
      case 'psychology':
        return <Psychology />;
      case 'mistakes':
        return <Mistakes />;
      case 'accounts':
        return <Accounts />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={setPage} />;
    }
  };

  return (
    <DataProvider>
      <Layout currentPage={page} onNavigate={setPage}>
        {renderPage()}
      </Layout>
    </DataProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
