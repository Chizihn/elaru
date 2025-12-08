import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat with Agent | Elaru",
  description:
    "Interact with your selected AI agent in a secure, blockchain-verified session.",
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
