import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | FarmOrbit - Farm Management Platform",
  description: "Create a new FarmOrbit account to start managing your farms and livestock",
};

export default function SignUp() {
  return <SignUpForm />;
}
