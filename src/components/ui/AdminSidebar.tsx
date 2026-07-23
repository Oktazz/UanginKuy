"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Tag, Calendar, Map, LogOut } from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();

  const menu = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Harga Sampah", href: "/admin/prices", icon: Tag },
    { name: "Jadwal Operasional", href: "/admin/schedules", icon: Calendar },
    { name: "Manajemen Rute", href: "/admin/routes", icon: Map },
  ];

  return (
    <aside className="w-72 bg-surface border-r border-gray-100 flex flex-col h-screen fixed top-0 left-0 z-40 shadow-sm">
      <div className="p-8">
        <h1 className="text-3xl font-extrabold text-primary tracking-tight flex items-center">
          UanginKuy
          <span className="ml-2 bg-secondary text-primary-dark text-[10px] uppercase font-black px-2 py-1 rounded-lg">
            Admin
          </span>
        </h1>
        <p className="text-xs text-gray-400 font-medium mt-1">Control Panel V1.0</p>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-3 overflow-y-auto">
        {menu.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center space-x-4 px-5 py-4 rounded-2xl font-bold transition-all duration-300 group
                ${isActive ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-gray-500 hover:bg-gray-50 hover:text-primary'}
              `}
            >
              <Icon size={22} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary transition-colors'} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-gray-100">
        <form action="/auth/signout" method="post">
          <button type="submit" className="flex items-center justify-center space-x-3 px-4 py-4 w-full rounded-2xl font-bold text-error bg-error/5 hover:bg-error hover:text-white transition-all duration-300">
            <LogOut size={20} />
            <span>Keluar Sistem</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
