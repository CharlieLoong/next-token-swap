import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/provider/theme-provider';
import { SolanaProvider } from '@/components/provider/wallet-provider';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Token Swap',
  description: 'SPL Token Swap',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SolanaProvider>{children}</SolanaProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
