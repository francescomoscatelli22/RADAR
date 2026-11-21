import Saved from "@/components/saved/Saved";
import PageTransition from "@/components/nav/PageTransition";

export const metadata = { title: "Salvati · Radar" };

export default function Salvati() {
  return (
    <PageTransition>
      <Saved />
    </PageTransition>
  );
}
