import { useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { DEFAULT_EXPENSE_SUB_ITEMS, DEFAULT_INCOME_ITEMS } from '../../constants/categories';
import type { Category } from '../../types/budget';
import { LoginPage } from './LoginPage';

async function seedDefaultData(userId: string): Promise<void> {
  // Insert default expense sub-items
  const expenseRows = DEFAULT_EXPENSE_SUB_ITEMS.flatMap(
    ({ category, items }: { category: Category; items: string[] }) =>
      items.map((name, index) => ({
        user_id: userId,
        category,
        name,
        order: index,
      }))
  );

  if (expenseRows.length > 0) {
    await supabase.from('expense_sub_items').insert(expenseRows);
  }

  // Insert default income items
  const incomeRows = DEFAULT_INCOME_ITEMS.map((name, index) => ({
    user_id: userId,
    name,
    order: index,
  }));

  if (incomeRows.length > 0) {
    await supabase.from('income_items').insert(incomeRows);
  }

  // Insert default user settings
  await supabase
    .from('user_settings')
    .insert({ user_id: userId, show_goals: true });

  // Insert default goal
  await supabase
    .from('goals')
    .insert({ user_id: userId, title: '', content: '', order: 0 });
}

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const allowedEmail = import.meta.env.VITE_ALLOWED_EMAIL;

  const handleNewUser = useCallback(async (userId: string) => {
    // Check if this user already has data seeded
    const { data: existing } = await supabase
      .from('user_settings')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!existing) {
      await seedDefaultData(userId);
    }
  }, []);

  useEffect(() => {
    // Get the initial session
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (initialSession?.user && allowedEmail && initialSession.user.email !== allowedEmail) {
        await supabase.auth.signOut();
        setSession(null);
      } else {
        setSession(initialSession);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (event === 'SIGNED_IN' && currentSession?.user) {
        if (allowedEmail && currentSession.user.email !== allowedEmail) {
          await supabase.auth.signOut();
          setSession(null);
          alert('접근 권한이 없는 계정입니다.');
          return;
        }
        handleNewUser(currentSession.user.id);
      }
      
      setSession(currentSession);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [handleNewUser, allowedEmail]);

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: 'var(--accent-blue-light)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return <>{children}</>;
}
