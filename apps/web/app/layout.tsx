import type { Metadata } from 'next';

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
      <body style={{ fontFamily: 'system-ui, -apple-system, sans-serif', margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
