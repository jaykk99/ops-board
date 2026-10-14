import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'Ops Board', description: "What is running, what is done, what is next." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
