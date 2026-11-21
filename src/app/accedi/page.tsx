import AuthForm from "@/components/auth/AuthForm";

export const metadata = { title: "Accedi · Raidar" };

export default function Accedi() {
  return <AuthForm mode="login" />;
}
