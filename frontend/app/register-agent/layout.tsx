import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register New Agent | Elaru",
  description: "Stake AVAX and register your AI agent to start earning reputation and rewards on the Elaru network.",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
