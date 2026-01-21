import type { Metadata } from 'next';
import { RootProvider } from 'fumadocs-ui/provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Layers API',
  description: 'Unified AI gateway with authentication, credit management, and usage tracking',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
