import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../shared/Card';

export function AccountCard() {
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }
    };
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      '정말로 회원탈퇴를 하시겠습니까? 모든 데이터가 삭제되며 복구할 수 없습니다.'
    );
    if (!confirmed) return;

    try {
      // TODO: Create a Supabase database function 'delete_user' that deletes the user and all associated data
      await supabase.rpc('delete_user');
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Failed to delete account:', err);
      alert('회원탈퇴에 실패했습니다. 관리자에게 문의해주세요.');
    }
  };

  return (
    <Card>
      <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">계정</h3>

      <p className="mb-6 text-sm text-[var(--text-secondary)]">{email}</p>

      <div className="flex gap-3">
        <button
          onClick={handleSignOut}
          className="rounded-lg border border-[var(--border-default)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-muted)]"
        >
          로그아웃
        </button>
        <button
          onClick={handleDeleteAccount}
          className="rounded-lg bg-[var(--status-negative)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
        >
          회원탈퇴
        </button>
      </div>
    </Card>
  );
}
