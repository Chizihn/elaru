import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation | Elaru",
  description:
    "Learn how to integrate with Elaru's decentralized AI agent reputation marketplace.",
};

export default function DocumentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
