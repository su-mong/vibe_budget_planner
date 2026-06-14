import { Wallet } from 'lucide-react';
import { supabase } from '../../lib/supabase';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path
        d="M12 3C6.48 3 2 6.44 2 10.61c0 2.68 1.78 5.03 4.47 6.36-.15.54-.96 3.47-1 3.64 0 0-.02.07.04.1.05.03.11.01.11.01.14-.02 1.67-1.1 2.44-1.62.6.09 1.23.13 1.88.13 5.52 0 10-3.44 10-7.61C22 6.44 17.52 3 12 3z"
        fill="#3C1E1E"
      />
    </svg>
  );
}

function NaverIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path d="M16.27 3H7.73v18h3.47V13.6L15.8 21h4.47V3h-3.47v7.4L12.2 3h-.93z" fill="#FFFFFF" />
    </svg>
  );
}

async function handleGoogleLogin() {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
}

async function handleKakaoLogin() {
  await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: { redirectTo: window.location.origin },
  });
}

async function handleNaverLogin() {
  await supabase.auth.signInWithOAuth({
    provider: 'naver' as any,
    options: { redirectTo: window.location.origin },
  });
}

export function LoginPage() {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8 shadow-lg"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        {/* Logo and Title */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl"
            style={{ backgroundColor: 'var(--accent-blue)' }}
          >
            <Wallet className="h-7 w-7 text-white" />
          </div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Budget Recorder
          </h1>
          <p
            className="text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            SNS 계정으로 간편 로그인
          </p>
        </div>

        {/* SNS Login Buttons */}
        <div className="flex flex-col gap-3">
          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-opacity hover:opacity-80"
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
          >
            <GoogleIcon />
            Google로 계속하기
          </button>

          {/* Kakao */}
          <button
            type="button"
            onClick={handleKakaoLogin}
            className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border-0 px-4 py-3 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#FEE500', color: '#3C1E1E' }}
          >
            <KakaoIcon />
            Kakao로 계속하기
          </button>

          {/* Naver */}
          <button
            type="button"
            onClick={handleNaverLogin}
            className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border-0 px-4 py-3 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#03C75A', color: '#FFFFFF' }}
          >
            <NaverIcon />
            Naver로 계속하기
          </button>
        </div>

        {/* Footer */}
        <p
          className="mt-8 text-center text-xs"
          style={{ color: 'var(--text-tertiary)' }}
        >
          로그인 시 서비스 이용약관에 동의합니다
        </p>
      </div>
    </div>
  );
}
