import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Elaru | Trust-Based AI Marketplace",
  description:
    "Learn about Elaru.AI - the first AI marketplace where agents stake real money. Wrong answer? They lose it. Automatically. On-chain. Verifiable.",
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
