import { ChevronDown, LogOut } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { MobileMenuButton } from "./Sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthUser } from "@/lib/auth/use-auth";
import { signOut } from "@/lib/auth/service";

interface TopBarProps {
  title: string;
  breadcrumbs?: { label: string; to?: string }[] | undefined;
  onMobileMenuOpen: () => void;
}

function initials(name?: string | null) {
  if (!name?.trim()) return "K";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "K";
}

export function TopBar({ title, breadcrumbs = [], onMobileMenuOpen }: TopBarProps) {
  const user = useAuthUser();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    await navigate({ to: "/login" });
  }

  return (
    <header className="h-14 flex items-center gap-3 px-4 lg:px-6 border-b border-border bg-white shrink-0">
      <MobileMenuButton onClick={onMobileMenuOpen} />
      <div className="flex-1 min-w-0">
        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-0.5">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span>/</span>}
                <span className={i === breadcrumbs.length - 1 ? "text-primary" : ""}>{b.label}</span>
              </span>
            ))}
          </div>
        )}
        <h1 className="text-[15px] font-semibold text-foreground leading-tight truncate">{title}</h1>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-border bg-white pl-1 pr-2 py-1 hover:bg-accent"
            aria-label="Open profile menu"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0d5c56] text-[11px] font-semibold text-white">
              {initials(user?.name)}
            </span>
            <span className="hidden sm:flex flex-col items-start min-w-0">
              <span className="text-[12px] font-medium text-foreground max-w-[140px] truncate leading-tight">
                {user?.name ?? "Account"}
              </span>
              {user?.role && (
                <span className="text-[10px] text-muted-foreground leading-tight">{user.role}</span>
              )}
            </span>
            <ChevronDown size={14} className="hidden sm:block text-muted-foreground" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="text-[13px] font-medium text-foreground truncate">{user?.name ?? "KRICS User"}</div>
            <div className="text-[11px] text-muted-foreground truncate">{user?.email ?? ""}</div>
            {user?.role && <div className="text-[11px] text-muted-foreground mt-0.5">{user.role}</div>}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-danger focus:text-danger cursor-pointer"
            onSelect={() => { void handleLogout(); }}
          >
            <LogOut size={14} />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
