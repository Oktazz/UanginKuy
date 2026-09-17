"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Tag,
  Calendar,
  Map,
  LogOut,
  Settings,
  UserCog,
  BookOpenCheck,
  Store,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { logout } from "@/app/(auth)/login/actions";
import { cn } from "@/lib/utils";

export interface AdminSidebarProps {
  isSuperAdmin: boolean;
  isCollapsed?: boolean;
  onToggle?: () => void;
  onItemClick?: () => void;
}

export function AdminSidebar({
  isSuperAdmin,
  isCollapsed = false,
  onToggle,
  onItemClick,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const menu = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Loket", href: "/admin/counter", icon: Store },
    { name: "Manajemen Rute", href: "/admin/routes", icon: Map },
    { name: "Jadwal Operasional", href: "/admin/schedules", icon: Calendar },
    { name: "Harga Sampah", href: "/admin/prices", icon: Tag },
    { name: "Data Nasabah", href: "/admin/nasabah", icon: Users },
    { name: "Pengetahuan AI", href: "/admin/knowledge", icon: BookOpenCheck },
    ...(isSuperAdmin
      ? [
          { name: "Manajemen Staf", href: "/admin/users", icon: UserCog },
          { name: "Pengaturan Gudang", href: "/admin/settings/warehouse", icon: Settings },
        ]
      : []),
  ];

  return (
    <aside
      className={cn(
        "bg-surface border-r border-gray-100 flex flex-col h-screen fixed top-0 left-0 z-40 shadow-sm transition-all duration-300 ease-in-out select-none",
        isCollapsed ? "w-16 sm:w-20" : "w-72"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "transition-all duration-300 border-b border-gray-100/80 shrink-0",
          isCollapsed ? "py-5 px-2 flex flex-col items-center gap-3" : "p-6"
        )}
      >
        {!isCollapsed ? (
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <Image
                  src="/logo.png"
                  alt="UanginKuy Logo"
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain shrink-0"
                  priority
                />
                <span className="text-2xl font-extrabold text-primary tracking-tight whitespace-nowrap">
                  UanginKuy
                </span>
              </div>

              {onToggle && (
                <button
                  type="button"
                  onClick={onToggle}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer shrink-0 ml-1"
                  title="Perkecil Sidebar"
                  aria-label="Perkecil Sidebar"
                >
                  <PanelLeftClose size={18} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2 ml-[52px]">
              <span className="bg-secondary text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-lg shrink-0">
                {isSuperAdmin ? "Super Admin" : "Admin"}
              </span>
              <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                Control Panel V1.0
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Image
              src="/logo.png"
              alt="UanginKuy Logo"
              width={40}
              height={40}
              className="h-9 w-9 object-contain shrink-0"
              priority
            />
            {onToggle && (
              <button
                type="button"
                onClick={onToggle}
                className="p-2 rounded-xl text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                title="Perbesar Sidebar"
                aria-label="Perbesar Sidebar"
              >
                <PanelLeftOpen size={18} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav
        className={cn(
          "flex-1 space-y-2 overflow-y-auto overflow-x-hidden py-4",
          isCollapsed ? "px-2" : "px-4"
        )}
      >
        {menu.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <div key={item.name} className="relative group">
              <Link
                href={item.href}
                onClick={onItemClick}
                title={isCollapsed ? item.name : undefined}
                className={cn(
                  "flex items-center rounded-2xl font-bold transition-all duration-300",
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-gray-500 hover:bg-gray-50 hover:text-primary",
                  isCollapsed
                    ? "w-11 h-11 sm:w-12 sm:h-12 mx-auto justify-center p-0"
                    : "space-x-3.5 px-4 py-3.5"
                )}
              >
                <Icon
                  size={20}
                  className={cn(
                    "shrink-0 transition-colors",
                    isActive ? "text-white" : "text-gray-400 group-hover:text-primary"
                  )}
                />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>

              {/* Floating Tooltip when collapsed */}
              {isCollapsed && (
                <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50">
                  <div className="rounded-xl bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xl whitespace-nowrap">
                    {item.name}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div
        className={cn(
          "border-t border-gray-100 transition-all duration-300 shrink-0",
          isCollapsed ? "p-3 flex justify-center" : "p-5"
        )}
      >
        <form action={logout} className="w-full">
          {isCollapsed ? (
            <div className="relative group flex justify-center">
              <button
                type="submit"
                title="Keluar Sistem"
                aria-label="Keluar Sistem"
                className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl font-bold text-error bg-error/5 hover:bg-error hover:text-white transition-all duration-300 cursor-pointer"
              >
                <LogOut size={18} />
              </button>
              <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50">
                <div className="rounded-xl bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xl whitespace-nowrap">
                  Keluar Sistem
                </div>
              </div>
            </div>
          ) : (
            <button
              type="submit"
              className="flex items-center justify-center space-x-3 px-4 py-3.5 w-full rounded-2xl font-bold text-error bg-error/5 hover:bg-error hover:text-white transition-all duration-300 cursor-pointer"
            >
              <LogOut size={18} />
              <span>Keluar Sistem</span>
            </button>
          )}
        </form>
      </div>
    </aside>
  );
}
