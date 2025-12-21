import type { Metadata } from 'next';
import './globals.css';  // ← Make sure this line exists

export const metadata: Metadata = {
  title: 'Tabz',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}