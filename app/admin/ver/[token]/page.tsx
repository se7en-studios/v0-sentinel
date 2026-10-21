import type { Metadata } from "next";
import { SharedView } from "@/components/admin/shared-view";

// the token is in the URL: never leak it through the Referer header to tile servers
export const metadata: Metadata = {
  title: "Vista compartida",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function SharedPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <SharedView token={token} />;
}
