import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, Lock, ShieldCheck, User } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { APP_NAME } from "@/lib/constants";
import { signIn } from "@/lib/auth/service";
import { ApiError } from "@/types/api";
import { cn } from "@/lib/utils";

type LoginSearch = { redirect?: string; reason?: string };

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
    reason: typeof search.reason === "string" ? search.reason : undefined,
  }),
  component: LoginPage,
});

const fieldClass =
  "h-12 w-full rounded-md border border-[#d8e0e2] bg-white pl-10 pr-3 text-[14px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary";

function LoginPage() {
  const { redirect: redirectTo, reason } = Route.useSearch();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(
    reason === "expired" ? "Your session has expired. Please sign in again." : null,
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await signIn({ username: username.trim(), password }, remember);
      const target = redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
        ? redirectTo
        : "/dashboard";
      await navigate({ to: target as never });
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message || "Unable to sign in. Please try again.");
      } else {
        setFormError("Unable to sign in. Please try again.");
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
        <h1 className="mt-1.5 text-[26px] font-semibold tracking-tight text-[#172126]">Welcome back</h1>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          Sign in to continue to {APP_NAME}
        </p>

        {formError && (
          <div
            role="alert"
            className="mt-5 rounded-md border border-danger/25 bg-danger-soft px-3 py-2.5 text-[13px] text-danger"
          >
            {formError}
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={(e) => void onSubmit(e)} noValidate>
          <div>
            <Label htmlFor="username" className="text-[13px] text-[#172126]">Username / Email</Label>
            <div className="relative mt-1.5">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                id="username"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username or email"
                className={fieldClass}
                disabled={submitting}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="text-[13px] text-[#172126]">Password</Label>
            <div className="relative mt-1.5">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={cn(fieldClass, "pr-11")}
                disabled={submitting}
              />
              <TooltipProvider delayDuration={250}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    {showPassword ? "Hide password" : "Show password"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            <label className="flex items-center gap-2 text-[13px] text-foreground cursor-pointer">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(v) => setRemember(v === true)}
                disabled={submitting}
              />
              Remember me
            </label>
            <Link
              to="/forgot-password"
              className="text-[13px] font-medium text-primary hover:underline underline-offset-2"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#0d5c56] text-[14px] font-medium text-white hover:bg-[#0a4a46] disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? "Signing in..." : "Sign In"}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-[#e6eeef]" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-[12px] text-muted-foreground">or</span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 rounded-md bg-primary-soft px-3 py-2.5 text-[12px] text-[#0d5c56]">
          <ShieldCheck size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p><span className="font-medium">Secure Access:</span> Your data is protected and confidential.</p>
        </div>
      </div>
    </AuthLayout>
  );
}
