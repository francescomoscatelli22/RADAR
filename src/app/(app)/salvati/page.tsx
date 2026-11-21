import Saved from "@/components/saved/Saved";
import PageTransition from "@/components/nav/PageTransition";

export const metadata = { title: "Salvati · Raidar" };

export default function Salvati() {
  return (
    <PageTransition>
      <Saved />
    </PageTransition>
  );
}
