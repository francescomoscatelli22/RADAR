import Following from "@/components/follow/Following";
import PageTransition from "@/components/nav/PageTransition";

export const metadata = { title: "Seguiti · Radar" };

export default function Seguiti() {
  return (
    <PageTransition>
      <Following />
    </PageTransition>
  );
}
