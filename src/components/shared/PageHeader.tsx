import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  children?: ReactNode;
}

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="font-display text-[28px] font-bold leading-tight text-[var(--text-primary)]">
        {title}
      </h1>
      {children && <div>{children}</div>}
    </div>
  );
}
