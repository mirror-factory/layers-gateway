import type { Metadata } from 'next';
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
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
