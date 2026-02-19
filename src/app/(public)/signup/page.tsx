import { enabledProviders } from "@/server/auth";
import { SignupForm } from "./_components/signup-form";

export default function SignupPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignupForm enabledProviders={enabledProviders} />
      </div>
    </div>
  );
}
