// File: app/workspaces/_components/WorkspaceManager.tsx (نسخه کامل و نهایی)
"use client";

import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Heading,
  Box,
  Flex,
  TextField,
  Button,
  Text,
  Card,
  Separator,
  Dialog,
  Badge,
  Grid,
} from "@radix-ui/themes";
import {
  PlusIcon,
  PersonIcon,
  GearIcon,
  EnterIcon,
} from "@radix-ui/react-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { WorkspaceWithDetails } from "../page";
import Spinner from "@/app/components/Spinner";
import useWorkspaceStore, { ActiveWorkspace } from "../store";

interface ApiError {
  error: string;
}

// ✅ اصلاح: تعریف props کامپوننت فرزند به صورت صحیح
interface WorkspaceCardProps {
  ws: WorkspaceWithDetails;
  onEnter: () => void;
  onManage: () => void;
}

// کامپوننت برای نمایش یک کارت ورک‌اسپیس
const WorkspaceCard = ({ ws, onEnter, onManage }: WorkspaceCardProps) => {
  if (!ws.workspace) return null;

  return (
    <Card>
      <Flex direction="column" gap="3" style={{ height: "100%" }}>
        <Flex justify="between" align="start">
          <Heading as="h3" size="4">
            {ws.workspace.name}
          </Heading>
          <Badge color={ws.role === "OWNER" ? "orange" : "gray"}>
            {ws.role}
          </Badge>
        </Flex>
        <Text size="2" color="gray" className="flex-grow">
          {ws.workspace.description || "بدون توضیحات"}
        </Text>
        <Separator my="2" size="4" />
        <Flex justify="between" align="center" gap="2">
          <Flex align="center" gap="1">
            <PersonIcon />
            <Text size="2">{ws.workspace._count.members} عضو</Text>
          </Flex>
          <Flex gap="2">
            {/* ✅ اصلاح: استفاده از props صحیح */}
            <Button variant="soft" onClick={onEnter}>
              <EnterIcon /> ورود
            </Button>
            <Button variant="ghost" color="gray" onClick={onManage}>
              <GearIcon /> مدیریت
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Card>
  );
};


const WorkspaceManager = ({
  initialWorkspaces,
}: {
  initialWorkspaces: WorkspaceWithDetails[];
}) => {
    const router = useRouter();
    const setActiveWorkspace = useWorkspaceStore((state) => state.setActiveWorkspace);
    const queryClient = useQueryClient();
    const [newWorkspaceName, setNewWorkspaceName] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleEnterWorkspace = (membership: WorkspaceWithDetails) => {
        if (!membership.workspace) return;
        const activeWorkspaceData: ActiveWorkspace = {
            id: membership.workspaceId,
            name: membership.workspace.name,
            role: membership.role,
        };
        setActiveWorkspace(activeWorkspaceData);
        router.push(`/workspaces/${membership.workspaceId}`);
    };

    const { data: workspaces, error, isLoading } = useQuery<WorkspaceWithDetails[]>({
        queryKey: ["workspaces-management"],
        queryFn: () => axios.get("/api/workspaces").then((res) => res.data),
        initialData: initialWorkspaces,
    });

    const createWorkspaceMutation = useMutation({
        mutationFn: (name: string) => axios.post("/api/workspaces", { name }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["workspaces-management"] });
            alert("فضای کاری با موفقیت ایجاد شد.");
            setIsDialogOpen(false);
            setNewWorkspaceName("");
        },
        onError: (err) => {
            const axiosError = err as AxiosError<ApiError>;
            alert(axiosError.response?.data?.error || "خطا در ایجاد فضای کاری.");
        },
    });

    const handleCreateWorkspace = (e: FormEvent) => {
        e.preventDefault();
        if (!newWorkspaceName.trim()) return;
        createWorkspaceMutation.mutate(newWorkspaceName);
    };

    if (isLoading) return <Text>در حال بارگذاری فضاهای کاری...</Text>;
    if (error) return <Text color="red">خطا در بارگذاری اطلاعات.</Text>;

    return (
        <Flex direction="column" gap="5">
            <Flex justify="between" align="center">
                <Heading as="h2" size="6">لیست فضاهای کاری</Heading>
                <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <Dialog.Trigger>
                        <Button><PlusIcon /> ایجاد فضای کاری جدید</Button>
                    </Dialog.Trigger>
                    <Dialog.Content style={{ maxWidth: 450 }} dir="rtl">
                        <Dialog.Title>ایجاد فضای کاری جدید</Dialog.Title>
                        <Dialog.Description size="2" mb="4">نام فضای کاری جدید خود را وارد کنید.</Dialog.Description>
                        <form onSubmit={handleCreateWorkspace}>
                            <TextField.Input value={newWorkspaceName} onChange={(e) => setNewWorkspaceName(e.target.value)} placeholder="مثال: تیم بازاریابی" required />
                            <Flex gap="3" mt="4" justify="end">
                                <Dialog.Close><Button variant="soft" color="gray" type="button">انصراف</Button></Dialog.Close>
                                <Button disabled={createWorkspaceMutation.isPending}>
                                    {createWorkspaceMutation.isPending && <Spinner />} ایجاد
                                </Button>
                            </Flex>
                        </form>
                    </Dialog.Content>
                </Dialog.Root>
            </Flex>

            <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="4">
                {workspaces?.map(ws => (
                    // ✅ اینجا هیچ تغییری لازم نیست چون props ارسالی اکنون صحیح است
                    <WorkspaceCard 
                        key={ws.id} 
                        ws={ws} 
                        onEnter={() => handleEnterWorkspace(ws)}
                        onManage={() => router.push(`/workspaces/${ws.workspaceId}/settings`)}
                    />
                ))}
            </Grid>
            {workspaces?.length === 0 && <Text color="gray" className="text-center">شما هنوز عضو هیچ فضای کاری نیستید.</Text>}
        </Flex>
    );
};

export default WorkspaceManager;