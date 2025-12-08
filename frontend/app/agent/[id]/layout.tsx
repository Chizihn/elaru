import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agent Profile | Elaru",
  description:
    "View detailed agent profile, reputation history, and validator attestations.",
};

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
