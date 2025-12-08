import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Task History | Elaru",
  description:
    "View your complete task history, payments, and agent interactions.",
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
