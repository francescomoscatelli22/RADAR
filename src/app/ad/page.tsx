import type { Metadata } from "next";
import Ad from "@/components/ad/Ad";

export const metadata: Metadata = {
  title: "Raidar · Pubblicità",
};

export default function AdPage() {
  return <Ad />;
}
