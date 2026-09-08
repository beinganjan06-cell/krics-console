import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Mail, ShieldCheck } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Label } from "@/components/ui/label";
import { APP_NAME } from "@/lib/constants";
import { requestPasswordReset } from "@/lib/auth/service";
import { ApiError } from "@/types/api";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await requestPasswordReset({ email: email.trim() || "admin@krics.karnataka.gov.in" });
      setSubmitted(true);
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
      } else {
        setFormError("Unable to submit the request. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div className="rounded-xl border border-[#e6eeef] bg-white p-7 sm:p-8 shadow-[0_8px_30px_rgba(23,33,38,0.08)]">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-soft text-primary">
          <ShieldCheck size={18} aria-hidden="true" />
        </div>
        <p className="mt-4 text-[11px] font-semibold tracking-[0.14em] text-primary">SECURE ACCESS</p>
        <h1 className="mt-1.5 text-[26px] font-semibold tracking-tight text-[#172126]">Forgot your password?</h1>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          Enter your registered email address and we&apos;ll help you reset your password.
        </p>

        {formError && !submitted && (
          <div role="alert" className="mt-5 rounded-md border border-danger/25 bg-danger-soft px-3 py-2.5 text-[13px] text-danger">
            {formError}
          </div>
        )}

        {submitted ? (
          <div className="mt-6 rounded-md border border-border bg-[#f4f7f8] px-4 py-3 text-[13px] text-foreground">
            If an account exists for this address, an administrator can complete the password reset.
            No email has been sent from this screen.
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={(e) => void onSubmit(e)} noValidate>
            <div>
              <Label htmlFor="email" className="text-[13px] text-[#172126]">Email address</Label>
              <div className="relative mt-1.5">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@krics.karnataka.gov.in"
                  className="h-12 w-full rounded-md border border-[#d8e0e2] bg-white pl-10 pr-3 text-[14px] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  disabled={submitting}
                />
              </div>
            </div>
            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center rounded-md bg-[#0d5c56] text-[14px] font-medium text-white hover:bg-[#0a4a46] disabled:opacity-60"
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? "Submitting..." : "Send reset link"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-[13px]">
          <Link to="/login" className="font-medium text-primary hover:underline underline-offset-2">
            Back to Sign In
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
