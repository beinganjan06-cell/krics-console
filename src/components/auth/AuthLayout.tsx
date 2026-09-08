import type { ReactNode } from "react";
import { BarChart3, Building2, FileText, HardHat } from "lucide-react";
import { APP_NAME, APP_SUBTITLE, ORG_NAME } from "@/lib/constants";
import { KricsLogo } from "@/components/brand/KricsLogo";

const FEATURES = [
  { icon: Building2, label: "Institution Management" },
  { icon: HardHat, label: "Construction & Works" },
  { icon: BarChart3, label: "Progress Monitoring" },
  { icon: FileText, label: "Reports & Data Import" },
] as const;

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f4f7f8] text-foreground flex flex-col lg:flex-row">
      <aside className="relative lg:w-[36%] min-h-[280px] lg:min-h-screen flex flex-col overflow-hidden bg-[#0d5c56] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "linear-gradient(135deg, transparent 40%, #0a4a46 40.5%, #0a4a46 42%, transparent 42.5%), linear-gradient(160deg, transparent 62%, #0a4a46 62.5%, #0a4a46 64%, transparent 64.5%)",
          }}
          aria-hidden="true"
        />
        <div className="relative z-10 flex flex-col flex-1 px-6 py-6 sm:px-8 lg:px-10 lg:py-9">
          <KricsLogo wordmark light />
          <h1 className="mt-8 lg:mt-11 text-[26px] lg:text-[32px] font-semibold leading-tight tracking-tight">
            {APP_NAME}
          </h1>
          <p className="mt-2 text-[13px] text-white/75">{APP_SUBTITLE}</p>
          <div className="mt-4 h-px w-12 bg-white/35" aria-hidden="true" />
          <p className="mt-5 max-w-sm text-[13px] leading-relaxed text-white/85 hidden sm:block">
            Manage institutions, infrastructure works, site availability, and construction progress from one
            centralized platform.
          </p>
          <ul className="hidden sm:flex flex-col gap-3.5 mt-8">
            {FEATURES.map((item) => (
              <li key={item.label} className="flex items-center gap-3 text-[13px] text-white/90">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/25 bg-white/5">
                  <item.icon size={15} strokeWidth={1.75} aria-hidden="true" />
                </span>
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative h-[180px] sm:h-[220px] lg:h-[38%] mt-auto">
          <img
            src="/auth-campus.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a4a46] via-[#0d5c56]/35 to-[#0d5c56]/15" />
          <div className="absolute inset-x-0 bottom-0 z-10 px-6 sm:px-8 lg:px-10 pb-5">
            <p className="text-[12px] font-medium leading-snug">{ORG_NAME}</p>
            <p className="mt-0.5 text-[11px] text-white/80">Secure Government Operations Portal</p>
          </div>
        </div>
      </aside>

      <main className="relative flex-1 lg:w-[64%] flex flex-col items-center justify-center px-4 py-10 sm:px-10">
        <p className="absolute top-5 right-6 hidden sm:block text-[10px] tracking-[0.18em] text-[#8a9699]">
          GOVERNMENT • EDUCATION • DEVELOPMENT
        </p>
        <svg
          className="pointer-events-none absolute bottom-6 right-6 h-52 w-52 text-[#c9d5d8] opacity-45"
          viewBox="0 0 180 160"
          fill="none"
          aria-hidden="true"
        >
          <path d="M16 148h148" stroke="currentColor" strokeWidth="1.3" />
          <path d="M28 148V92h20V70h64v22h20v56" stroke="currentColor" strokeWidth="1.3" />
          <path d="M48 70V44l42-28 42 28v26" stroke="currentColor" strokeWidth="1.3" />
          <path d="M78 148V108h24v40" stroke="currentColor" strokeWidth="1.3" />
          <path d="M58 58h8M78 58h8M98 58h8M118 58h8" stroke="currentColor" strokeWidth="1.3" />
          <path d="M58 88h8v12h-8zm20 0h8v12h-8zm20 0h8v12h-8zm20 0h8v12h-8z" stroke="currentColor" strokeWidth="1.1" />
          <path d="M36 112h12M132 112h12M36 128h12M132 128h12" stroke="currentColor" strokeWidth="1.2" />
        </svg>
        <div className="relative z-10 w-full max-w-[440px]">
          {children}
        </div>
      </main>
    </div>
  );
}
