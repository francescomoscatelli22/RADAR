import TopicPicker from "@/components/topics/TopicPicker";

export const metadata = { title: "Argomenti · Raidar" };

// Scelta degli argomenti: prima volta (dopo la registrazione) e modifica.
export default function Argomenti() {
  return <TopicPicker />;
}
