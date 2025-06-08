// app/workspaces/_components/WorkspaceManager.tsx
"use client";

import React, { useState, FormEvent } from "react";
import {
  Heading,
  Box,
  Flex,
  TextField,
  Button,
  Callout,
  Text,
  Card,
  Separator,
  Dialog,
  Badge,
  Grid,
} from "@radix-ui/themes";
import { PlusIcon, PersonIcon, GearIcon } from "@radix-ui/react-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { Workspace, WorkspaceMember, User } from "@prisma/client";

// تایپ‌های لازم
type WorkspaceWithDetails = WorkspaceMember & {
  workspace: Workspace & { _count: { members: number; teams: number } };
};
interface ApiError {
  error: string;
}

// کامپوننت برای نمایش یک کارت ورک‌اسپیس
const WorkspaceCard = ({ ws }: { ws: WorkspaceWithDetails }) => (
  <Card>
    <Flex direction="column" gap="3">
      <Flex justify="between" align="start">
        <Heading as="h3" size="4">
          {ws.workspace.name}
        </Heading>
        <Badge color={ws.role === "OWNER" ? "orange" : "gray"}>{ws.role}</Badge>
      </Flex>
      <Text size="2" color="gray">
        {ws.workspace.description || "بدون توضیحات"}
      </Text>
      <Separator my="2" size="4" />
      <Flex justify="between" align="center">
        <Flex align="center" gap="3">
          <Flex align="center" gap="1">
            <PersonIcon />
            <Text size="2">{ws.workspace._count.members} عضو</Text>
          </Flex>
        </Flex>
        <Button variant="soft" color="gray">
          <GearIcon /> مدیریت
        </Button>
      </Flex>
    </Flex>
  </Card>
);

// کامپوننت اصلی مدیریت
const WorkspaceManager = ({
  initialWorkspaces,
  allUsers,
}: {
  initialWorkspaces: WorkspaceWithDetails[];
  allUsers: User[];
}) => {
  const queryClient = useQueryClient();
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // استفاده از React Query برای مدیریت داده‌های ورک‌اسپیس‌ها
  const { data: workspaces, error } = useQuery<WorkspaceWithDetails[]>({
    queryKey: ["workspaces-management"],
    queryFn: () => axios.get("/api/workspaces").then((res) => res.data),
    initialData: initialWorkspaces,
  });

  // استفاده از React Query Mutation برای ایجاد ورک‌اسپیس جدید
  const createWorkspaceMutation = useMutation({
    mutationFn: (name: string) => axios.post("/api/workspaces", { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces-management"] });
      alert("ورک‌اسپیس با موفقیت ایجاد شد.");
      setIsDialogOpen(false);
      setNewWorkspaceName("");
    },
    onError: (err) => {
      const axiosError = err as AxiosError<ApiError>;
      alert(axiosError.response?.data?.error || "خطا در ایجاد ورک‌اسپیس.");
    },
  });

  const handleCreateWorkspace = (e: FormEvent) => {
    e.preventDefault();
    createWorkspaceMutation.mutate(newWorkspaceName);
  };

  return (
    <Flex direction="column" gap="5">
      <Flex justify="between" align="center">
        <Heading as="h2" size="6">
          لیست ورک‌اسپیس‌ها
        </Heading>
        <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Dialog.Trigger>
            <Button>
              <PlusIcon /> ایجاد ورک‌اسپیس جدید
            </Button>
          </Dialog.Trigger>
          <Dialog.Content style={{ maxWidth: 450 }} dir="rtl">
            <Dialog.Title>ایجاد ورک‌اسپیس جدید</Dialog.Title>
            <Dialog.Description size="2" mb="4">
              نام ورک‌اسپیس جدید خود را وارد کنید.
            </Dialog.Description>
            <form onSubmit={handleCreateWorkspace}>
              <Flex direction="column" gap="3">
                <label>
                  <Text as="div" size="2" mb="1" weight="bold">
                    نام ورک‌اسپیس:
                  </Text>
                  <TextField.Input
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="مثال: تیم بازاریابی"
                    required
                  />
                </label>
              </Flex>
              <Flex gap="3" mt="4" justify="end">
                <Dialog.Close>
                  <Button variant="soft" color="gray">
                    انصراف
                  </Button>
                </Dialog.Close>
                <Button disabled={createWorkspaceMutation.isPending}>
                  {createWorkspaceMutation.isPending
                    ? "درحال ایجاد..."
                    : "ایجاد"}
                </Button>
              </Flex>
            </form>
          </Dialog.Content>
        </Dialog.Root>
      </Flex>

      <Callout.Root color="red">
        <Callout.Icon />
        <Callout.Text>
          {(error as Error).message || "خطا در بارگذاری ورک‌اسپیس‌ها."}
        </Callout.Text>
      </Callout.Root>

      <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="4">
        {workspaces?.map((ws) => (
          <WorkspaceCard key={ws.id} ws={ws} />
        ))}
      </Grid>
      {workspaces?.length === 0 && (
        <Text color="gray" className="text-center">
          شما هنوز عضو هیچ ورک‌اسپیسی نیستید.
        </Text>
      )}
    </Flex>
  );
};

export default WorkspaceManager;
