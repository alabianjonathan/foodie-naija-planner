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
    <nav className="absolute bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur px-2 py-2 md:rounded-b-[36px]">
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
