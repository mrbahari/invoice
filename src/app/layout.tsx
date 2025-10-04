
import type {Metadata} from 'next';
import { DataProvider } from '@/context/data-context';
import '@/app/globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { UserProvider } from '@/context/user-context';


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
      <body className="font-body antialiased overflow-x-hidden">
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            disableTransitionOnChange
        >
          <UserProvider>
            <DataProvider>
                <main className="relative z-10">
                  {children}
                </main>
                <Toaster />
            </DataProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
