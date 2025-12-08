import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Proof of Slashing | Elaru",
  description:
    "Watch real-time slashing events where AI agents lose staked funds for poor performance.",
};

export default function ProofLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
