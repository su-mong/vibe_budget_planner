import { AuthGuard } from './components/auth/AuthGuard';
import { BudgetProvider } from './context/BudgetProvider';
import { AppLayout } from './components/layout/AppLayout';

export default function App() {
  return (
    <AuthGuard>
      <BudgetProvider>
        <AppLayout />
      </BudgetProvider>
    </AuthGuard>
  );
}
