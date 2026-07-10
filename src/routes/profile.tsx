import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { TopBar } from "@/components/TopBar";
import { ChevronRight, Heart, Wallet, Target, Users, Store, Bell, LogOut, Flame } from "lucide-react";

export const Route = createFileRoute("/profile")({ component: Profile });

function Profile() {
  const items = [
    { icon: Target, label: "Health goal", value: "Weight loss", color: "bg-leaf/10 text-leaf" },
    { icon: Flame, label: "Daily calories", value: "2,200 kcal", color: "bg-brand/10 text-brand" },
    { icon: Wallet, label: "Daily budget", value: "₦5,000", color: "bg-warm/20 text-charcoal" },
    { icon: Users, label: "Family size", value: "3 people", color: "bg-secondary text-charcoal" },
  ];

  const links = [
    { icon: Heart, label: "Saved meals & plans", to: "/saved" },
    { icon: Store, label: "Become a restaurant partner", to: "/home" },
    { icon: Bell, label: "Notifications", to: "/home" },
  ];

  return (
    <PhoneShell>
      <TopBar title="Profile" back="/home" />
      <div className="px-6 pt-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-brand to-warm flex items-center justify-center text-white font-display text-2xl">A</div>
          <div>
            <h2 className="font-display text-xl">Adaeze Okonkwo</h2>
            <p className="text-xs text-muted-foreground">Lagos, Nigeria</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {items.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="card-soft !p-4">
              <div className={`h-9 w-9 rounded-xl ${color} flex items-center justify-center`}><Icon className="h-4 w-4" /></div>
              <p className="text-xs text-muted-foreground mt-3">{label}</p>
              <p className="font-semibold text-sm mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 card-soft !p-0 overflow-hidden">
          {links.map(({ icon: Icon, label, to }, i) => (
            <Link key={label} to={to} className={`flex items-center gap-3 p-4 ${i < links.length - 1 ? "border-b border-border" : ""}`}>
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium">{label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>

        <Link to="/" className="mt-6 flex items-center justify-center gap-2 rounded-full bg-secondary py-3.5 text-sm font-medium text-destructive">
          <LogOut className="h-4 w-4" /> Sign out
        </Link>
      </div>
      <div className="h-6" />
    </PhoneShell>
  );
}
