import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

import {
  CalendarIcon,
  ClockIcon,
  HomeIcon,
  ShoppingBagIcon,
  UserIcon,
} from "./icons";

type NavKey = "home" | "shop" | "booking" | "history" | "account";

interface BottomNavProps {
  active: NavKey;
}

export function BottomNav({ active }: BottomNavProps) {
  const items: Array<{
    key: NavKey;
    label: string;
    to: string;
    icon: ReactNode;
  }> = [
    {
      key: "home",
      label: "Trang chủ",
      to: "/",
      icon: <HomeIcon width={22} height={22} />,
    },
    {
      key: "shop",
      label: "Dịch vụ",
      to: "/services",
      icon: <ShoppingBagIcon width={22} height={22} />,
    },
    {
      key: "booking",
      label: "Đặt lịch",
      to: "/booking",
      icon: <CalendarIcon width={24} height={24} />,
    },
    {
      key: "history",
      label: "Lịch sử",
      to: "/booking",
      icon: <ClockIcon width={22} height={22} />,
    },
    {
      key: "account",
      label: "Tài khoản",
      to: "/",
      icon: <UserIcon width={22} height={22} />,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 max-w-lg mx-auto bg-white/95 backdrop-blur-lg border-t border-surface-border shadow-nav pb-safe-bottom"
      aria-label="Điều hướng chính"
    >
      <div className="flex items-stretch">
        {items.map((item) => {
          const isActive = active === item.key;
          const isCenter = item.key === "booking";

          return (
            <NavLink
              key={item.key}
              to={item.to}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
                isCenter ? "relative" : ""
              } ${
                isActive
                  ? "text-brand-700"
                  : "text-gray-400"
              }`}
            >
              {isCenter ? (
                <span className="w-12 h-12 -mt-4 flex items-center justify-center rounded-full bg-brand-700 text-white shadow-button">
                  {item.icon}
                </span>
              ) : (
                <span className="flex items-center justify-center h-7">
                  {item.icon}
                </span>
              )}
              <span className={`text-[11px] font-semibold leading-tight ${isCenter ? "mt-0.5" : ""}`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
