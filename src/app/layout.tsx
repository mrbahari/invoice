
import type {Metadata} from 'next';
import { DataProvider } from '@/context/data-context';
import '@/app/globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
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
    <html lang="fa" dir="rtl" suppressHydrationWarning className="overflow-x-hidden">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased overflow-x-hidden w-full">
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            disableTransitionOnChange
        >
          <FirebaseClientProvider>
            <DataProvider>
                <div className="max-w-7xl mx-auto w-full">
                  <CanvasBackground />
                  <main className="relative z-10">
                    {children}
                  </main>
                </div>
                <Toaster />
            </DataProvider>
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
