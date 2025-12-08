import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Validator Portal | Elaru",
  description: "Participate in the decentralized justice system by validating tasks and resolving disputes.",
};

export default function ValidatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
