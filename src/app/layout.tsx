import { Outfit } from 'next/font/google';
import './globals.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { LocalizationProvider } from '@/context/LocalizationContext';
import { ReduxProvider } from '@/providers/ReduxProvider';
import { NotificationProvider } from '@/providers/NotificationProvider';

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ReduxProvider>
          <LocalizationProvider>
            <ThemeProvider>
              <SidebarProvider>
                <NotificationProvider>
                  {children}
                </NotificationProvider>
              </SidebarProvider>
            </ThemeProvider>
          </LocalizationProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
