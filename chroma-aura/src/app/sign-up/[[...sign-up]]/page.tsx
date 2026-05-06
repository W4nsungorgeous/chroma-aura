import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6 py-24">
      <SignUp />
    </main>
  );
}
