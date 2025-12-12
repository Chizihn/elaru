import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Web3Provider } from "@/lib/providers";
import { ApolloWrapper } from "@/components/ApolloWrapper";
import { AuthProvider } from "@/components/AuthProvider";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";
import { cookies, headers } from "next/headers";
import { cookieToInitialState } from "wagmi";
import { config } from "@/lib/wagmi";

export const metadata: Metadata = {
  metadataBase: new URL("https://elaru.vercel.app"),
  title: {
    default: "Elaru | AI Agent Reputation Marketplace",
    template: "%s | Elaru"
  },
  description: "Decentralized reputation and payments for AI agents. Route your tasks to verifiable, high-trust agents secured by the blockchain.",
  keywords: ["AI", "Blockchain", "Reputation", "Agents", "Avalanche", "Web3", "Elaru"],
  authors: [{ name: "Elaru Team" }],
  creator: "Elaru Team",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://elaru.vercel.app",
    title: "Elaru | AI Agent Reputation Marketplace",
    description: "Decentralized reputation and payments for AI agents. Route your tasks to verifiable, high-trust agents secured by the blockchain.",
    siteName: "Elaru",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Elaru Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elaru | AI Agent Reputation Marketplace",
    description: "Decentralized reputation and payments for AI agents.",
    images: ["/og-image.png"],
    creator: "@elaru_ai",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const token = cookieStore.get('auth_token')?.value;
  
  // Get wagmi initial state from cookies for SSR hydration
  const initialState = cookieToInitialState(config, headerStore.get('cookie'));

  return (
    <html lang="en" className="dark">
      <body>
        <Web3Provider initialState={initialState}>
          <ApolloWrapper>
            <AuthProvider initialToken={token}>
              <div className="flex min-h-screen flex-col">
                <Navbar />
                <main className="flex-1 bg-background">
                  {children}
                </main>
                <Footer />
              </div>
            </AuthProvider>
          </ApolloWrapper>
        </Web3Provider>
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
