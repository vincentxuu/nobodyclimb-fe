'use client';

import React from 'react';
import { UserCircle, FileText, Bookmark, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number | string }>;
}

const menuItems: MenuItem[] = [
  {
    name: '我的人物誌',
    href: '/profile',
    icon: UserCircle,
  },
  {
    name: '我的文章',
    href: '/profile/articles',
    icon: FileText,
  },
  {
    name: '收藏文章',
    href: '/profile/bookmarks',
    icon: Bookmark,
  },
  {
    name: '帳號設定',
    href: '/profile/settings',
    icon: Settings,
  },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 w-full bg-white border-b border-[#DBD8D8] flex items-center justify-center h-14 space-x-6">
      {menuItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            className={`flex flex-col items-center ${isActive ? 'text-[#1B1A1A] font-medium' : 'text-[#6D6C6C]'}`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
