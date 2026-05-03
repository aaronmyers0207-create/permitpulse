import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Try Permit Tracer Free — Live Demo",
  description:
    "See how Permit Tracer turns building permits into sales leads. Preview the dashboard with sample data — no sign-up required.",
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No auth checks — this is a public sandbox
  return <>{children}</>;
}
