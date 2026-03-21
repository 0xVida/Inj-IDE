import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Inj IDE: Injective CosmWasm Development",
  description: "Browser-based IDE for developing, compiling, and deploying Injective CosmWasm smart contracts",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

import { WalletProvider } from "@/context/WalletContext";
import { Toaster } from "sonner";
import { Polyfills } from "@/components/Polyfills";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <WalletProvider>
          <Polyfills />
          {children}
          <Toaster position="top-right" richColors />
        </WalletProvider>
      </body>
    </html>
  );
}
