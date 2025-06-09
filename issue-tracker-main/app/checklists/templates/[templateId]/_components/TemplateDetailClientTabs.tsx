// app/checklists/templates/[templateId]/_components/TemplateDetailClientTabs.tsx
"use client";

import React, { useState } from "react";
import {
  Heading,
  Text,
  Box,
  Flex,
  Card,
  Separator,
  Button as RadixButton,
  Tabs,
  Badge,
  Tooltip,
  Select,
  Button,
  IconButton,
  Avatar,
} from "@radix-ui/themes";
import Link from "next/link";
import {
  ChecklistItem,
  ChecklistTemplate as PrismaChecklistTemplate,
  User,
  Category,
  Tag,
  CategoryOnChecklistTemplates,
  TagOnChecklistTemplates,
  PermissionLevel,
  Team,
  WorkspaceMember,
} from "@prisma/client";
import AssignChecklistForm from "./AssignChecklistForm";
import EditTemplateDetailsForm from "./EditTemplateDetailsForm";
import {
  EyeOpenIcon,
  Pencil1Icon,
  CalendarIcon,
  ReaderIcon,
  BookmarkIcon,
  TrashIcon,
  LockClosedIcon,
} from "@radix-ui/react-icons";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { FullChecklistTemplate } from "@/app/checklists/types";

// ========== تعریف تایپ‌ها (Types) ==========
// این تایپ‌ها برای اطمینان از ارسال داده‌های صحیح از کامپوننت سرور به این کامپوننت کلاینت استفاده می‌شوند.
// این تایپ‌ها ساختار جدول واسط صریح را منعکس می‌کنند.

export type ChecklistTemplateFull = PrismaChecklistTemplate & {
  items: ChecklistItem[];
  categories: (CategoryOnChecklistTemplates & {
    category: Pick<Category, "id" | "name">;
  })[];
  tags: (TagOnChecklistTemplates & {
    tag: Pick<Tag, "id" | "name" | "color">;
  })[];
};

interface TemplateDetailClientTabsProps {
  template: ChecklistTemplateFull;
  allUsers: Pick<User, "id" | "name" | "email">[];
  allCategories: Pick<Category, "id" | "name">[];
  allTags: Pick<Tag, "id" | "name" | "color">[];
  defaultTab: "view" | "edit" | "assign";
  workspaceMembers: (WorkspaceMember & { user: Pick<User, "name"> })[]; // تایپ دقیق‌تر
  teams: Team[];
}

// کامپوننت جدید برای مدیریت دسترسی‌ها
const PermissionsManager = ({
  template,
  workspaceMembers,
  teams,
}: {
  template: any;
  workspaceMembers: any[];
  teams: Team[];
}) => {
  const queryClient = useQueryClient();
  const { data: permissions, refetch } = useQuery<any[]>({
    queryKey: ["permissions", template.id],
    queryFn: () =>
      axios
        .get(`/api/checklist-templates/${template.id}/permissions`)
        .then((res) => res.data),
  });

  const [targetType, setTargetType] = useState<"member" | "team">("member");
  const [targetId, setTargetId] = useState("");
  const [level, setLevel] = useState<PermissionLevel>(PermissionLevel.VIEW);

  const addPermissionMutation = useMutation({
    mutationFn: (newPermission: any) =>
      axios.post(
        `/api/checklist-templates/${template.id}/permissions`,
        newPermission
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["permissions", template.id] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = { level };
    if (targetType === "member") data.memberId = parseInt(targetId);
    else data.teamId = parseInt(targetId);
    addPermissionMutation.mutate(data);
  };

  return (
    <Card>
      <Heading as="h3" size="4" mb="4">
        مدیریت دسترسی‌ها
      </Heading>
      <form onSubmit={handleSubmit}>
        <Flex gap="3" align="end">
          <Select.Root
            value={targetType}
            onValueChange={(v) => {
              setTargetType(v as any);
              setTargetId("");
            }}
          >
            <Select.Trigger />
            <Select.Content>
              <Select.Item value="member">کاربر</Select.Item>
              <Select.Item value="team">تیم</Select.Item>
            </Select.Content>
          </Select.Root>
          <Select.Root value={targetId} onValueChange={setTargetId}>
            <Select.Trigger
              placeholder="انتخاب کنید..."
              className="flex-grow"
            />
            <Select.Content>
              {targetType === "member"
                ? workspaceMembers.map((m) => (
                    <Select.Item key={m.id} value={String(m.id)}>
                      {m.user.name}
                    </Select.Item>
                  ))
                : teams.map((t) => (
                    <Select.Item key={t.id} value={String(t.id)}>
                      {t.name}
                    </Select.Item>
                  ))}
            </Select.Content>
          </Select.Root>
          <Select.Root value={level} onValueChange={(l) => setLevel(l as any)}>
            <Select.Trigger />
            <Select.Content>
              <Select.Item value={PermissionLevel.VIEW}>مشاهده</Select.Item>
              <Select.Item value={PermissionLevel.EDIT}>ویرایش</Select.Item>
              <Select.Item value={PermissionLevel.MANAGE}>
                مدیریت کامل
              </Select.Item>
            </Select.Content>
          </Select.Root>
          <Button type="submit" disabled={!targetId}>
            افزودن دسترسی
          </Button>
        </Flex>
      </form>
      {/* لیست دسترسی‌های فعلی */}
      <Box mt="4">
        {permissions?.map((p) => (
          <Flex
            key={p.id}
            justify="between"
            align="center"
            p="2"
            className="border-b"
          >
            <Flex align="center" gap="2">
              <Avatar
                fallback={
                  p.workspaceMember?.user?.name?.[0] || p.team?.name?.[0] || "?"
                }
                size="1"
                radius="full"
              />
              <Text>{p.workspaceMember?.user?.name || p.team?.name}</Text>
              <Badge color="gray">{p.workspaceMember ? "کاربر" : "تیم"}</Badge>
            </Flex>
            <Flex align="center" gap="3">
              <Text size="2" color="gray">
                {p.level}
              </Text>
              <IconButton color="red" variant="ghost" size="1">
                <TrashIcon />
              </IconButton>
            </Flex>
          </Flex>
        ))}
      </Box>
    </Card>
  );
};

// ========== کامپوننت اصلی ==========
const TemplateDetailClientTabs: React.FC<TemplateDetailClientTabsProps> = ({
  template,
  allUsers,
  allCategories,
  allTags,
  defaultTab,
  workspaceMembers, // اکنون به عنوان prop در دسترس است
  teams, // اکنون به عنوان prop در دسترس است
}) => {
  const router = useRouter();
  const currentSearchParams = useSearchParams();

  // تابعی برای تغییر تب که URL را نیز به‌روز می‌کند
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(currentSearchParams.toString());
    params.set("tab", value);
    // برای جلوگیری از پرش صفحه هنگام تغییر تب، از scroll: false استفاده می‌کنیم
    router.push(`/checklists/templates/${template.id}?${params.toString()}`, {
      scroll: false,
    });
  };

  return (
    <Tabs.Root
      defaultValue={defaultTab}
      onValueChange={handleTabChange}
      dir="rtl"
    >
      <Tabs.List>
        <Tabs.Trigger value="view">
          <EyeOpenIcon /> مشاهده
        </Tabs.Trigger>
        <Tabs.Trigger value="edit">
          <Pencil1Icon /> ویرایش
        </Tabs.Trigger>
        <Tabs.Trigger value="assign">
          <CalendarIcon /> تخصیص
        </Tabs.Trigger>
        <Tabs.Trigger value="permissions">
          <LockClosedIcon /> دسترسی‌ها
        </Tabs.Trigger>{" "}
        {/* ✅ تب جدید */}
      </Tabs.List>

      <Box pt="3">
        {/* === تب مشاهده الگو === */}
        <Tabs.Content value="view">
          <Card
            variant="surface"
            className="shadow-lg rounded-lg dark:bg-gray-800/80 backdrop-blur-sm"
          >
            <Box p="5">
              <Flex justify="between" align="start">
                <Heading
                  as="h2"
                  size="6"
                  mb="2"
                  className="text-gray-800 dark:text-gray-100 border-b pb-2 dark:border-gray-700"
                >
                  {template.title}
                </Heading>
                {!template.isActive && (
                  <Badge color="gray" variant="solid" radius="full">
                    آرشیو شده
                  </Badge>
                )}
              </Flex>
              <Text
                as="p"
                color="gray"
                size="3"
                mb="4"
                className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap"
              >
                {template.description || "بدون توضیحات."}
              </Text>

              {template.categories.length > 0 && (
                <Flex align="center" gap="2" mb="2">
                  <Text
                    weight="bold"
                    size="2"
                    className="text-gray-600 dark:text-gray-300"
                  >
                    دسته‌بندی‌ها:
                  </Text>
                  <Flex wrap="wrap" gap="1">
                    {template.categories.map((c) => (
                      <Badge
                        key={c.categoryId}
                        color="purple"
                        variant="soft"
                        radius="full"
                      >
                        {c.category.name}
                      </Badge>
                    ))}
                  </Flex>
                </Flex>
              )}
              {template.tags.length > 0 && (
                <Flex align="center" gap="2" mb="4">
                  <Text
                    weight="bold"
                    size="2"
                    className="text-gray-600 dark:text-gray-300"
                  >
                    برچسب‌ها:
                  </Text>
                  <Flex wrap="wrap" gap="1">
                    {template.tags.map((t) => (
                      <Badge
                        key={t.tagId}
                        color={t.tag.color as any}
                        variant="soft"
                        radius="full"
                      >
                        {t.tag.name}
                      </Badge>
                    ))}
                  </Flex>
                </Flex>
              )}

              <Separator my="4" size="4" className="dark:bg-gray-700" />

              <Heading
                as="h3"
                size="5"
                mb="3"
                className="text-gray-700 dark:text-gray-200"
              >
                آیتم‌های الگو ({template.items.length})
              </Heading>
              {template.items.length === 0 && (
                <Text color="gray" className="italic">
                  این الگو هنوز آیتمی ندارد.
                </Text>
              )}
              <Flex direction="column" gap="3">
                {template.items.map((item, index) => (
                  <Card
                    key={item.id}
                    variant="classic"
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-md"
                  >
                    <Box p="3">
                      <Text
                        weight="bold"
                        className="text-gray-800 dark:text-gray-100"
                      >
                        {index + 1}. {item.title}
                      </Text>
                      {item.description && (
                        <Text
                          as="p"
                          size="2"
                          color="gray"
                          mt="1"
                          className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap"
                        >
                          {item.description}
                        </Text>
                      )}
                    </Box>
                  </Card>
                ))}
              </Flex>
            </Box>
          </Card>
        </Tabs.Content>

        {/* === تب ویرایش جزئیات === */}
        <Tabs.Content value="edit">
          <EditTemplateDetailsForm
            template={template as any} // Cast موقت برای سازگاری با پراپ‌های EditTemplateDetailsForm
            allCategories={allCategories}
            allTags={allTags}
          />
        </Tabs.Content>

        {/* === تب تخصیص الگو === */}
        <Tabs.Content value="assign">
          <Box
            p={{ initial: "0", sm: "5" }}
            className="bg-white dark:bg-gray-800/50 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <Heading
              as="h3"
              size="5"
              mb="4"
              className="text-gray-700 dark:text-gray-200 text-center sm:text-right"
            >
              تخصیص این الگو به کاربر
            </Heading>
            <AssignChecklistForm templateId={template.id} users={allUsers} />
          </Box>
        </Tabs.Content>
        <Tabs.Content value="permissions">
          <PermissionsManager
            template={template}
            workspaceMembers={workspaceMembers}
            teams={teams}
          />
        </Tabs.Content>
      </Box>
    </Tabs.Root>
  );
};

export default TemplateDetailClientTabs;
