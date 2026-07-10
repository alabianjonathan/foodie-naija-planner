import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function PhoneShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[oklch(0.97_0.03_130)] to-[oklch(0.94_0.05_100)] py-0 md:py-6">
      <div className="phone-shell overflow-hidden md:rounded-[36px] md:min-h-[900px] md:max-h-[900px]">
        <div className={`min-h-screen md:min-h-[900px] ${hideNav ? "" : "pb-24"} flex flex-col`}>
          {children}
        </div>
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
}
