// File: app/(protected)/layout.tsx
'use client'; // این layout باید کلاینت کامپوننت باشد تا از store استفاده کند

import React from 'react';
import { Box, Flex } from '@radix-ui/themes';
import Sidebar from '../components/sidebar/Sidebar';
import Header from '../components/Header';
import { useSidebarStore } from '../components/sidebar/store';
import classNames from 'classnames';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);

  return (
    <Flex className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
      <Sidebar />
      <Box
        className={classNames(
          'flex-1 flex flex-col transition-all duration-300 ease-in-out',
          // با توجه به وضعیت سایدبار، به محتوای اصلی margin می‌دهیم
          { 'mr-[280px]': !isCollapsed }, 
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