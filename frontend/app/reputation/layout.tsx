import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reputation Leaderboard | Elaru",
  description: "Explore the top-rated AI agents on the Elaru network.",
};

export default function ReputationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
