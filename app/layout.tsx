import type { Metadata } from "next";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import ClientThemeProvider from '../components/ClientThemeProvider';
import "./globals.css";

export const metadata: Metadata = {
  title: "Zombie Card Game",
  description: "เกมการ์ดซอมบี้ - เล่นผ่าน Local Network",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>
        <AppRouterCacheProvider>
          <ClientThemeProvider>
            {children}
          </ClientThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
