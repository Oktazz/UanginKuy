"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Map, QrCode, User } from "lucide-react";

export function CourierNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Rute", icon: Map, href: "/kurir/dashboard" },
    { label: "Scanner", icon: QrCode, href: "/kurir/scanner", highlight: true },
    { label: "Profil", icon: User, href: "/kurir/profile" },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full bg-surface border-t border-gray-200 pb-safe z-50">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/kurir/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;
            
            if (item.highlight) {
              return (
                <Link key={item.href} href={item.href} className="relative -top-5 flex flex-col items-center justify-center bg-primary rounded-full w-14 h-14 shrink-0 text-surface shadow-lg hover:bg-primary-dark transition-colors">
                  <Icon size={28} />
                </Link>
              );
            }
            
            return (
              <Link key={item.href} href={item.href} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? "text-primary" : "text-gray-400 hover:text-gray-600"}`}>
                <Icon size={24} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Side Navigation */}
      <nav className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-surface border-r border-gray-200 z-50">
        <div className="p-6 flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="UanginKuy Logo"
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
            priority
          />
          <div>
            <h1 className="text-xl font-bold text-primary">UanginKuy</h1>
            <p className="text-xs font-semibold text-muted-foreground">Kurir App</p>
          </div>
        </div>
        <div className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/kurir/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;
            
            if (item.highlight) {
              return (
                <Link key={item.href} href={item.href} className="flex items-center space-x-3 w-full px-4 py-3 bg-primary text-surface rounded-lg font-semibold hover:bg-primary-dark transition-colors mt-6 mb-4">
                  <Icon size={24} />
                  <span>{item.label}</span>
                </Link>
              );
            }
            
            return (
              <Link key={item.href} href={item.href} className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg font-medium transition-colors ${isActive ? "bg-background text-primary" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}>
                <Icon size={24} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
