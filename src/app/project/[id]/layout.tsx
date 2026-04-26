import type { ReactNode } from 'react';

export default function ProjectLayout({
  children,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  return <>{children}</>;
}
