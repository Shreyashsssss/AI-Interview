'use client';

import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
