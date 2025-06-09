// File: app/dashboard/_components/DashboardClient.tsx
"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Tabs,
  Box,
  Flex,
  Card,
  Heading,
  Text,
  Button,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  TextField,
  AlertDialog,
  Callout,
} from "@radix-ui/themes";
import {
  PersonIcon,
  PlusIcon,
  Pencil2Icon,
  TrashIcon,
  EnterIcon,
  ArchiveIcon,
} from "@radix-ui/react-icons";
import { Workspace, WorkspaceMember, WorkspaceRole } from "@prisma/client";
import { useSession } from "next-auth/react";
import axios from "axios";
import Spinner from "@/app/components/Spinner";
import { MembershipWithWorkspace } from "../page"; // تایپ از کامپوننت سرور

interface DashboardClientProps {
  initialMemberships: MembershipWithWorkspace[];
  user: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const DashboardClient: React.FC<DashboardClientProps> = ({
  initialMemberships,
  user,
}) => {
  const router = useRouter();
  const [memberships, setMemberships] = useState(initialMemberships);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State برای مدیریت دیالوگ‌های ویرایش و حذف
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(
    null
  );
  const [deletingWorkspace, setDeletingWorkspace] = useState<Workspace | null>(
    null
  );

  const handleUpdateWorkspace = (updatedWorkspace: Workspace) => {
    setMemberships((prev) =>
      prev.map((m) =>
        m.workspaceId === updatedWorkspace.id
          ? { ...m, workspace: updatedWorkspace }
          : m
      )
    );
    setEditingWorkspace(null); // بستن دیالوگ
  };

  const handleDeleteWorkspace = (workspaceId: number) => {
    setMemberships((prev) => prev.filter((m) => m.workspaceId !== workspaceId));
    setDeletingWorkspace(null); // بستن دیالوگ
  };

  return (
    <Tabs.Root defaultValue="workspaces" dir="rtl">
      <Tabs.List>
        <Tabs.Trigger value="profile">
          <Flex align="center" gap="2">
            <PersonIcon /> پروفایل
          </Flex>
        </Tabs.Trigger>
        <Tabs.Trigger value="workspaces">
          فضاهای کاری ({memberships.length})
        </Tabs.Trigger>
      </Tabs.List>

      <Box pt="4">
        <Tabs.Content value="profile">
          <Card>
            <Flex direction="column" gap="3" align="center" p="5">
              <Avatar
                src={user.image!}
                fallback={user.name?.charAt(0) || "U"}
                size="6"
                radius="full"
              />
              <Heading as="h2" size="5">
                {user.name}
              </Heading>
              <Text color="gray">{user.email}</Text>
              <Button mt="3" variant="soft" color="gray">
                ویرایش پروفایل (غیرفعال)
              </Button>
            </Flex>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="workspaces">
          <Flex direction="column" gap="4">
            <Flex justify="end">
              <Button onClick={() => router.push("/workspaces/new")}>
                <PlusIcon /> ایجاد فضای کاری جدید
              </Button>
            </Flex>

            {memberships.length === 0 && (
              <Text color="gray" align="center" className="p-5">
                شما هنوز در هیچ فضای کاری عضو نیستید.
              </Text>
            )}

            {memberships.map(({ workspace, role }) => (
              <Card key={workspace.id}>
                <Flex justify="between" align="center">
                  <Flex direction="column" gap="1">
                    <Heading as="h3" size="4">
                      {workspace.name}
                    </Heading>
                    <Text size="2" color="gray">
                      {workspace.description || "بدون توضیحات"}
                    </Text>
                    <Text size="1" color="gray" mt="1">
                      نقش شما: {role}
                    </Text>
                  </Flex>
                  <Flex gap="2" align="center">
                    <Tooltip content="ورود به فضای کاری">
                      <Button
                        variant="soft"
                        onClick={() =>
                          alert(
                            `وارد فضای کاری با ID: ${workspace.id} شوید... بعدا پیاده‌سازی می‌شود`
                          )
                        }
                      >
                        <EnterIcon /> ورود
                      </Button>
                    </Tooltip>
                    {(role === WorkspaceRole.OWNER ||
                      role === WorkspaceRole.ADMIN) && (
                      <Tooltip content="ویرایش">
                        <IconButton
                          variant="ghost"
                          onClick={() => setEditingWorkspace(workspace)}
                        >
                          <Pencil2Icon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {role === WorkspaceRole.OWNER && (
                      <Tooltip content="حذف">
                        <IconButton
                          variant="ghost"
                          color="red"
                          onClick={() => setDeletingWorkspace(workspace)}
                        >
                          <TrashIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Flex>
                </Flex>
              </Card>
            ))}
          </Flex>
        </Tabs.Content>
      </Box>

      {/* دیالوگ ویرایش */}
      {editingWorkspace && (
        <EditWorkspaceDialog
          workspace={editingWorkspace}
          onClose={() => setEditingWorkspace(null)}
          onSuccess={handleUpdateWorkspace}
        />
      )}

      {/* دیالوگ تایید حذف */}
      <DeleteWorkspaceDialog
        workspace={deletingWorkspace}
        onClose={() => setDeletingWorkspace(null)}
        onSuccess={handleDeleteWorkspace}
      />
    </Tabs.Root>
  );
};

// کامپوننت دیالوگ ویرایش (می‌تواند در همین فایل باشد)
const EditWorkspaceDialog = ({
  workspace,
  onClose,
  onSuccess,
}: {
  workspace: Workspace;
  onClose: () => void;
  onSuccess: (ws: Workspace) => void;
}) => {
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const response = await axios.patch(`/api/workspaces/${workspace.id}`, {
        name,
        description,
      });
      onSuccess(response.data);
    } catch (err) {
      setError("خطا در به‌روزرسانی. لطفاً دوباره تلاش کنید.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open onOpenChange={onClose}>
      <Dialog.Content dir="rtl">
        <Dialog.Title>ویرایش فضای کاری</Dialog.Title>
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3" mt="4">
            <label>
              <Text as="div" size="2" weight="bold">
                نام:
              </Text>
              <TextField.Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                mt="1"
              />
            </label>
            <label>
              <Text as="div" size="2" weight="bold">
                توضیحات (اختیاری):
              </Text>
              <TextField.Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                mt="1"
              />
            </label>
          </Flex>
          {error && (
            <Callout.Root color="red" my="3">
              <Callout.Text>{error}</Callout.Text>
            </Callout.Root>
          )}
          <Flex mt="4" justify="end" gap="3">
            <Dialog.Close>
              <Button variant="soft" color="gray" type="button">
                انصراف
              </Button>
            </Dialog.Close>
            <Button type="submit" disabled={isSubmitting}>
              ذخیره {isSubmitting && <Spinner />}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
};

// کامپوننت دیالوگ حذف
const DeleteWorkspaceDialog = ({
  workspace,
  onClose,
  onSuccess,
}: {
  workspace: Workspace | null;
  onClose: () => void;
  onSuccess: (id: number) => void;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!workspace) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/workspaces/${workspace.id}`);
      onSuccess(workspace.id);
    } catch (error) {
      alert("خطا در حذف فضای کاری.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog.Root open={!!workspace} onOpenChange={onClose}>
      <AlertDialog.Content dir="rtl">
        <AlertDialog.Title>تایید حذف</AlertDialog.Title>
        <AlertDialog.Description>
          آیا از حذف فضای کاری <Text weight="bold">{workspace?.name}</Text>{" "}
          مطمئن هستید؟ این عمل غیرقابل بازگشت است و تمام داده‌های مرتبط با آن
          (تیم‌ها، مسائل، چک‌لیست‌ها و...) حذف خواهند شد.
        </AlertDialog.Description>
        <Flex mt="4" justify="end" gap="3">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray" disabled={isDeleting}>
              انصراف
            </Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button color="red" onClick={handleDelete} disabled={isDeleting}>
              حذف کامل {isDeleting && <Spinner />}
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
};

export default DashboardClient;
