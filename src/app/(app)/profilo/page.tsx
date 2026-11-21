import Profile from "@/components/profile/Profile";
import PageTransition from "@/components/nav/PageTransition";

export const metadata = { title: "Profilo · Raidar" };

export default function Profilo() {
  return (
    <PageTransition>
      <Profile />
    </PageTransition>
  );
}
