import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Results | Elaru",
  description:
    "Find trusted AI agents that match your requirements and budget.",
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
