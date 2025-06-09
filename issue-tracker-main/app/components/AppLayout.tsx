// File: app/components/AppLayout.tsx
'use client';

import React from 'react';
import { Box, Flex } from '@radix-ui/themes';
import Sidebar from './sidebar/Sidebar';
import Header from './Header';
import { useSidebarStore } from './sidebar/store';
import classNames from 'classnames';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { isCollapsed } = useSidebarStore();

  return (
    <Flex className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
      {/* کامپوننت سایدبار در اینجا قرار می‌گیرد */}
      <Sidebar />

      {/* محتوای اصلی که عرض آن بر اساس وضعیت سایدبار تغییر می‌کند */}
      <Box
        className={classNames(
          'flex-1 flex flex-col transition-all duration-300 ease-in-out',
          // اگر سایدبار باز است، margin-right را اعمال کن
          { 'mr-[280px]': !isCollapsed }, 
          // اگر سایدبار جمع شده است، margin-right کمتری اعمال کن
          { 'mr-[72px]': isCollapsed } 
        )}
      >
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">
            {children}
        </main>
      </Box>
    </Flex>
  );
};

export default AppLayout;