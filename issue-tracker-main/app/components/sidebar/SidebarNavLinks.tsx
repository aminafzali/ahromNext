// File: app/components/sidebar/SidebarNavLinks.tsx (نسخه نهایی)
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebarStore } from './store';
import useWorkspaceStore from '@/app/(protected)/workspaces/store';
import { HomeIcon, CheckCircledIcon, VercelLogoIcon } from '@radix-ui/react-icons';
import classnames from 'classnames';
import { Flex, Text, Tooltip } from '@radix-ui/themes';

interface SidebarNavLinksProps {
  isCollapsed: boolean;
}

const SidebarNavLinks = ({ isCollapsed }: SidebarNavLinksProps) => {
  const currentPath = usePathname();
  const { setMobileOpen } = useSidebarStore();
  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  
  if (!activeWorkspace) {
    return (
        <div className={classnames("px-4 py-2 text-sm text-gray-500", { 'hidden': isCollapsed })}>
            یک فضای کاری انتخاب کنید.
        </div>
    );
  }

  const links = [
    { label: "داشبورد", href: `/workspaces/${activeWorkspace.id}`, icon: <HomeIcon width="18" height="18" /> },
    { label: "مسائل", href: `/workspaces/${activeWorkspace.id}/issues`, icon: <VercelLogoIcon width="18" height="18" /> },
    { label: "چک‌لیست‌ها", href: `/workspaces/${activeWorkspace.id}/checklists`, icon: <CheckCircledIcon width="18" height="18" /> },
  ];

  return (
    <nav className="flex flex-col gap-1">
      {links.map(link => (
        <Tooltip content={link.label} side="left" align="center" key={link.label} open={isCollapsed ? undefined : false}>
          <Link
            href={link.href}
            onClick={() => setMobileOpen(false)}
            className={classnames(
              'flex items-center gap-3 rounded-md text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800',
              {
                'bg-gray-200 dark:bg-gray-800 font-semibold': currentPath.startsWith(link.href),
                'h-10 px-3': !isCollapsed,
                'h-10 w-10 justify-center': isCollapsed,
              }
            )}
          >
            {link.icon}
            {!isCollapsed && <span className="text-sm">{link.label}</span>}
          </Link>
        </Tooltip>
      ))}
    </nav>
  );
};

export default SidebarNavLinks;