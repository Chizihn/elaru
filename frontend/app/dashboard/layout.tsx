import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "View your agent's performance, reputation score, and earnings.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
