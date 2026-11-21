import AppHeader from "@/components/nav/AppHeader";
import BottomNav from "@/components/nav/BottomNav";

/*
  Cornice dell'app vera e propria: testata in alto, tre schede in basso.
  Le pagine di accesso e di scelta degli argomenti stanno fuori da questo gruppo (niente barre).
*/
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <main
        className="mx-auto w-full max-w-[640px] flex-1 px-4 pt-5"
        style={{ paddingBottom: "calc(var(--nav-h) + var(--safe-bottom) + 32px)" }}
      >
        {children}
      </main>
      <BottomNav />
    </>
  );
}
