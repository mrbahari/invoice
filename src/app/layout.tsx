import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/components/auth/auth-provider';
import { DataProvider } from '@/context/data-context'; // Import DataProvider
import { ThemeProvider } from '@/components/theme-provider';
import CanvasBackground from '@/components/canvas-background';

export const metadata: Metadata = {
  title: 'حسابگر',
  description: 'اپلیکیشن مدیریت فاکتور',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CanvasBackground />
          <DataProvider>
            <AuthProvider>
              <div className="relative z-10">
                {children}
              </div>
            </AuthProvider>
          </DataProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
