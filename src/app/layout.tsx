import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "YZU Platform - Learning Management System",
  description: "Platform pembelajaran dengan video edukasi dan sistem pembayaran terintegrasi",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
