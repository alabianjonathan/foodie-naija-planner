import { Link } from "@tanstack/react-router";
import { Home, Sparkles, CalendarDays, Heart, User } from "lucide-react";

const items = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/today", label: "Today", icon: Sparkles },
  { to: "/planner", label: "Planner", icon: CalendarDays },
  { to: "/saved", label: "Saved", icon: Heart },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 border-t border-border bg-card/95 backdrop-blur px-2 pt-2"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
    >
      <ul className="flex items-center justify-between">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              className="flex flex-col items-center gap-0.5 py-2 text-muted-foreground text-[10px] font-medium transition-colors"
              activeProps={{ className: "text-brand" }}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
