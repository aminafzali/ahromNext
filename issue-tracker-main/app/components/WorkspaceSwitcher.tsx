// app/components/WorkspaceSwitcher.tsx
"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Avatar, Box, DropdownMenu, Flex, Text } from '@radix-ui/themes';
import { Skeleton } from "@/app/components";
import useWorkspaceStore, { ActiveWorkspace } from '@/app/workspaces/store';
import { CheckIcon } from '@radix-ui/react-icons';

const WorkspaceSwitcher = () => {
  // استفاده از store برای گرفتن و تنظیم ورک‌اسپیس فعال
  const { activeWorkspace, setActiveWorkspace } = useWorkspaceStore();
  
  // خواندن لیست ورک‌اسپیس‌ها از API
  const { data: workspaces, isLoading, error } = useQuery<ActiveWorkspace[]>({
    queryKey: ['workspaces'],
    queryFn: () => axios.get('/api/workspaces').then(res => res.data),
    staleTime: 60 * 1000 * 5, // 5 minutes
  });

  if (isLoading) return <Skeleton width="8rem" height="2rem" />;
  
  // اگر ورک‌اسپیس فعالی وجود نداشت (مثلا در اولین ورود)، چیزی نمایش نده
  if (error || !workspaces || !activeWorkspace) return null;

  return (
    <Box>
      <DropdownMenu.Root dir="rtl">
        <DropdownMenu.Trigger>
          <button className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Avatar
              fallback={activeWorkspace.name.substring(0, 2)}
              size="2"
              radius="full"
              color="gray"
            />
            <Text weight="bold" size="2">{activeWorkspace.name}</Text>
          </button>
        </DropdownMenu.Trigger >
        <DropdownMenu.Content align="end" >
          <DropdownMenu.Label>ورک‌اسپیس‌های شما</DropdownMenu.Label>
          {workspaces.map(ws => (
            <DropdownMenu.Item key={ws.id} onSelect={() => setActiveWorkspace(ws)}>
              <Flex justify="between" align="center" width="100%">
                {ws.name}
                {ws.id === activeWorkspace.id && <CheckIcon />}
              </Flex>
            </DropdownMenu.Item>
          ))}
          <DropdownMenu.Separator />
          <DropdownMenu.Item>مدیریت ورک‌اسپیس‌ها</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </Box>
  );
};

export default WorkspaceSwitcher;
