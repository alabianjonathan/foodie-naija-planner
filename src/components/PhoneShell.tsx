import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function PhoneShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  return (
    <div className="bg-gradient-to-br from-[oklch(0.97_0.03_130)] to-[oklch(0.94_0.05_100)] py-0 md:py-6" style={{ minHeight: "100dvh" }}>
      <div className="phone-shell overflow-hidden md:rounded-[36px]">
        <div
          className={`flex flex-col ${hideNav ? "" : "pb-24"}`}
          style={{ minHeight: "100dvh", paddingBottom: hideNav ? undefined : "calc(env(safe-area-inset-bottom) + 5.5rem)" }}
        >
          {children}
        </div>
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
}
