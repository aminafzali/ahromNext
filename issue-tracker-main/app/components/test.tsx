// File: app/components/sidebar/SidebarNavLinks.tsx (نسخه نهایی و اصلاح شده)
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebarStore } from './store';
import useWorkspaceStore from '@/app/(protected)/workspaces/store';
import { 
    HomeIcon, 
    DashboardIcon, 
    PersonIcon, 
    MixerVerticalIcon, 
    ListBulletIcon,
    CheckCircledIcon 
} from '@radix-ui/react-icons';
import classnames from 'classnames';
import { Flex, Text, Tooltip } from '@radix-ui/themes';
import React from 'react'; // ایمپورت React برای استفاده از ReactNode

// ✅ اصلاح دوم: تعریف یک اینترفیس برای آبجکت‌های لینک
interface NavLink {
    label: string;
    href: string;
    icon: React.ReactNode;
    exact?: boolean;
}

interface SidebarNavLinksProps {
  isCollapsed: boolean;
}

const SidebarNavLinks = ({ isCollapsed }: SidebarNavLinksProps) => {
  const pathname = usePathname();
  // ✅ اصلاح اول: استفاده از اکشن صحیح برای بستن سایدبار در موبایل
  const { setMobileOpen } = useSidebarStore();
  const { activeWorkspace } = useWorkspaceStore();
  
  const isInWorkspace = pathname.startsWith('/workspaces/');
  const isGeneralDashboard = pathname === '/dashboard';

  // ✅ اصلاح دوم: تعریف نوع برای آرایه links
  let links: NavLink[] = [];

  if (isInWorkspace && activeWorkspace) {
    links = [
      { label: "داشبورد فضای کاری", href: `/workspaces/${activeWorkspace.id}`, icon: <DashboardIcon width="18" height="18" />, exact: true },
      { label: "مسائل", href: `/workspaces/${activeWorkspace.id}/issues`, icon: <ListBulletIcon width="18" height="18" /> },
      { label: "چک‌لیست‌ها", href: `/workspaces/${activeWorkspace.id}/checklists`, icon: <CheckCircledIcon width="18" height="18" /> },
    ];
  } else if (isGeneralDashboard) {
    links = [
      { label: "پروفایل کاربری", href: `/dashboard?tab=profile`, icon: <PersonIcon width="18" height="18" /> },
      { label: "مدیریت فضاهای کاری", href: `/dashboard?tab=workspaces`, icon: <MixerVerticalIcon width="18" height="18" /> },
    ];
  }

  return (
    <nav className="flex flex-col gap-1">
      {links.map(link => {
        const isActive = link.exact 
            ? pathname === link.href 
            : pathname.startsWith(link.href);

        return (
            <Tooltip content={link.label} side="left" align="center" key={link.label} open={isCollapsed ? undefined : false}>
              <Link
                href={link.href}
                onClick={() => setMobileOpen(false)} // ✅ اصلاح اول: فراخوانی اکشن صحیح
                className={classnames(
                  'flex items-center gap-3 rounded-md text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-200/50 dark:hover:bg-slate-800',
                  {
                    'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-200 font-semibold': isActive,
                    'h-10 px-3': !isCollapsed,
                    'h-10 w-10 justify-center': isCollapsed,
                  }
                )}
              >
                {link.icon}
                {!isCollapsed && <span className="text-sm">{link.label}</span>}
              </Link>
            </Tooltip>
        );
      })}
    </nav>
  );
};

export default SidebarNavLinks;