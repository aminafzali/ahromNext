// File: app/components/sidebar/Sidebar.tsx (نسخه نهایی)
"use client";

import React, { useEffect, useState } from "react";
import classNames from "classnames";
import { useSession, signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useSidebarStore } from "./store";
import useWorkspaceStore, { ActiveWorkspace } from "@/app/(protected)/workspaces/store";

import {
  Avatar,
  Box,
  Button,
  DropdownMenu,
  Flex,
  Heading,
  IconButton,
  Separator,
  Text,
  Tooltip,
} from "@radix-ui/themes";
import {
  ExitIcon,
  PlusCircledIcon,
  ShuffleIcon,
  DoubleArrowRightIcon,
  DoubleArrowLeftIcon,
} from "@radix-ui/react-icons";
import SidebarNavLinks from "./SidebarNavLinks";
import { WorkspaceMember } from "@prisma/client";
import { WorkspaceWithDetails } from "@/app/(protected)/workspaces/page";

const Sidebar = () => {
  const [isMounted, setIsMounted] = useState(false);
  const { isCollapsed, toggleCollapse } = useSidebarStore();
  const { activeWorkspace, setActiveWorkspace } = useWorkspaceStore();
  const { data: session } = useSession();
  const router = useRouter();

  const { data: memberships, isLoading } = useQuery<
    WorkspaceMember & { workspace: WorkspaceWithDetails }[]
  >({
    queryKey: ["workspaces"],
    queryFn: () => axios.get("/api/workspaces").then((res) => res.data),
  });

  useEffect(() => {
    setIsMounted(true);
    // اگر فضای کاری فعالی در استور وجود ندارد، اولین مورد را به عنوان فعال انتخاب کن
    if (!activeWorkspace && memberships && memberships.length > 0) {
      const firstMembership = memberships[0];
      setActiveWorkspace({
        // TODO: این بخش از کد باید اصلاح شود
        
        id: firstMembership.workspaceId,
        name: firstMembership.workspace.name,
        role: firstMembership.role,
      });
    }
  }, [memberships, activeWorkspace, setActiveWorkspace]);

  if (!isMounted) return null; // جلوگیری از خطای Hydration

  const handleWorkspaceChange = (membership: any) => {
    const newActiveWorkspace: ActiveWorkspace = {
      id: membership.workspaceId,
      name: membership.workspace.name,
      role: membership.role,
    };
    setActiveWorkspace(newActiveWorkspace);
    router.push(`/workspaces/${membership.workspaceId}`);
  };

  return (
    <aside
      className={classNames(
        "fixed top-0 right-0 h-full bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-800 flex flex-col z-20 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[72px]" : "w-[280px]"
      )}
    >
      <Flex direction="column" className="p-3 flex-1 h-full">
        {/* بخش بالایی: لوگو و دکمه بستن */}
        <Flex align="center" justify="between" className="px-1" mb="4">
          {!isCollapsed && (
            <Link href="/dashboard">
              <Heading>اهرم</Heading>
            </Link>
          )}
          <IconButton variant="ghost" onClick={toggleCollapse}>
            {isCollapsed ? <DoubleArrowLeftIcon /> : <DoubleArrowRightIcon />}
          </IconButton>
        </Flex>

        {/* بخش انتخاب فضای کاری */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Button variant="outline" className="w-full justify-between">
              <Flex align="center" gap="2" className="truncate">
                <Avatar
                  fallback={activeWorkspace?.name?.charAt(0) || "W"}
                  size="1"
                  radius="full"
                />
                {!isCollapsed && (
                  <Text className="truncate">
                    {activeWorkspace?.name || "انتخاب ورک‌اسپیس"}
                  </Text>
                )}
              </Flex>
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="start" className="w-[250px]">
            {memberships?.map((membership: any) => (
              <DropdownMenu.Item
                key={membership.workspaceId}
                onSelect={() => handleWorkspaceChange(membership)}
              >
                {membership.workspace.name}
              </DropdownMenu.Item>
            ))}
            <DropdownMenu.Separator />
            <DropdownMenu.Item onSelect={() => router.push("/dashboard")}>
              <ShuffleIcon /> مدیریت ورک‌اسپیس‌ها
            </DropdownMenu.Item>
            <DropdownMenu.Item onSelect={() => router.push("/workspaces/new")}>
              <PlusCircledIcon /> ایجاد ورک‌اسپیس جدید
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>

        <Separator my="4" size="4" />

        {/* بخش لینک‌های اصلی */}
        <Box className="flex-grow overflow-y-auto">
          <SidebarNavLinks isCollapsed={isCollapsed} />
        </Box>

        <Separator my="2" size="4" />

        {/* بخش پروفایل کاربر در پایین */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <button className="w-full p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
              <Flex gap="3" align="center">
                <Avatar
                  src={session?.user?.image!}
                  fallback={session?.user?.name?.charAt(0) || "?"}
                  size="2"
                  radius="full"
                />
                {!isCollapsed && (
                  <Text weight="bold" size="2" className="truncate">
                    {session?.user?.name}
                  </Text>
                )}
              </Flex>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="start" side="top">
            <DropdownMenu.Label>{session?.user?.email}</DropdownMenu.Label>
            <DropdownMenu.Separator />
            <DropdownMenu.Item onSelect={() => signOut()} color="red">
              <ExitIcon /> خروج
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Flex>
    </aside>
  );
};

export default Sidebar;
