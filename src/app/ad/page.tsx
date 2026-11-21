import type { Metadata } from "next";
import Ad from "@/components/ad/Ad";

export const metadata: Metadata = {
  title: "Radar · Pubblicità",
};

export default function AdPage() {
  return <Ad />;
}
