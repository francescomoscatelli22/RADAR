import Profile from "@/components/profile/Profile";
import PageTransition from "@/components/nav/PageTransition";

export const metadata = { title: "Profilo · Radar" };

export default function Profilo() {
  return (
    <PageTransition>
      <Profile />
    </PageTransition>
  );
}
