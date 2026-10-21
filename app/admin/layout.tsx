import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel de monitoreo",
  description:
    "Panel de monitoreo satelital de incendios forestales de Sentinel Cloud.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
