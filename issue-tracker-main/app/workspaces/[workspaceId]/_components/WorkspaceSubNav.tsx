// File: app/workspaces/[workspaceId]/_components/WorkspaceSubNav.tsx
'use client';

import { WorkspaceRole } from '@prisma/client';
import { Flex } from '@radix-ui/themes';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import classnames from 'classnames';

interface Props {
  workspaceId: number;
  userRole: WorkspaceRole;
}

const WorkspaceSubNav = ({ workspaceId, userRole }: Props) => {
  const currentPath = usePathname();
  const isAdmin = userRole === WorkspaceRole.ADMIN || userRole === WorkspaceRole.OWNER;

  const links = [
    // شما می‌توانید لینک‌های بیشتری مانند داشبورد، مسائل و... را در اینجا اضافه کنید
    { label: 'اعضا و تنظیمات', href: `/workspaces/${workspaceId}/settings`, adminOnly: true },
    { label: 'چک‌لیست‌ها', href: `/workspaces/${workspaceId}/checklists` },
     { label: 'مسائل', href: `/workspaces/${workspaceId}/issues` },
  ];

  return (
    // از تگ <nav> برای معنای بهتر استفاده می‌کنیم
    <nav className="border-b dark:border-gray-700 mb-5">
      {/* و از Flex برای چیدمان لینک‌ها در داخل آن */}
      <Flex gap="6" py="2" direction="row-reverse">
        {links.map(link => {
          // اگر لینک فقط برای ادمین است و کاربر ادمین نیست، آن را نمایش نده
          if (link.adminOnly && !isAdmin) return null;
          
          return (
            <Link
              key={link.href}
              className={classnames(
                'pb-2 transition-colors',
                {
                  'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600': link.href === currentPath,
                  'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white': link.href !== currentPath
                }
              )}
              href={link.href}
            >
              {link.label}
            </Link>
          )
        })}
      </Flex>
    </nav>
  );
};

export default WorkspaceSubNav;