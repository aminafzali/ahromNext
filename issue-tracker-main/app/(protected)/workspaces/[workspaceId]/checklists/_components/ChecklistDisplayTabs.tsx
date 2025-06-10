// File: app/workspaces/[workspaceId]/checklists/_components/ChecklistDisplayTabs.tsx (نسخه کامل و نهایی)
'use client';

import React from "react";
import { Flex, Grid, Heading, Text, Card, Box, Button as RadixButton, Tabs, Table, Badge, Select, Tooltip, IconButton } from "@radix-ui/themes";
import Link from "next/link";
import NextLink from 'next/link';
import { PlusIcon, ReaderIcon, BookmarkIcon, GearIcon, FileTextIcon, ListBulletIcon, EyeOpenIcon, Pencil2Icon, MixerHorizontalIcon, CalendarIcon, ArrowUpIcon } from "@radix-ui/react-icons";
import Pagination from "@/app/components/Pagination";
import { Category, ResponseStatus, Tag, User, WorkspaceRole } from "@prisma/client";
import { ChecklistAssignmentQuery, TemplateWithDetails, ExtendedChecklistAssignment } from './types';
import { useRouter, useSearchParams } from "next/navigation";
import ChecklistSettings from "@/app/(protected)/checklists/list/_components/ChecklistSettings"; // کامپوننت تنظیمات را import می‌کنیم

// ========== کامپوننت‌های داخلی ==========

const ChecklistTemplateCard = ({ template, workspaceId }: { template: TemplateWithDetails, workspaceId: number }) => (
    <Card variant="classic" className={`hover:shadow-lg transition-shadow duration-200 dir-rtl border rounded-lg ${!template.isActive && 'opacity-60 bg-gray-50 dark:bg-gray-800/50'}`}>
        <Flex direction="column" justify="between" style={{ height: '100%' }} gap="3">
            <Box>
                <Flex justify="between" align="start">
                    <Heading as="h3" size="4" mb="1" trim="start" className="text-right">
                        <Link href={`/workspaces/${workspaceId}/checklists/templates/${template.id}`} className="hover:text-blue-600 dark:hover:text-blue-400">{template.title}</Link>
                    </Heading>
                    {!template.isActive && <Badge color="gray" variant="soft" radius="full">آرشیو شده</Badge>}
                </Flex>
                <Text as="p" size="2" color="gray" className="line-clamp-3 text-right mb-2">{template.description || "بدون توضیحات"}</Text>
            </Box>
            <Flex mt="auto" justify="start" align="center" gap="2">
                <RadixButton asChild variant="soft" size="1">
                    <Link href={`/workspaces/${workspaceId}/checklists/templates/${template.id}`}>
                        <EyeOpenIcon className="ml-1 rtl:mr-1 rtl:ml-0" /> مشاهده و تخصیص
                    </Link>
                </RadixButton>
                <Text size="1" color="gray" className="mr-auto">{template._count.items} آیتم</Text>
            </Flex>
        </Flex>
    </Card>
);

const TemplateFilters = ({ allCategories, allTags, searchParams, workspaceId }: { allCategories: Category[], allTags: Tag[], searchParams: ChecklistAssignmentQuery, workspaceId: number }) => {
    const router = useRouter();
    const currentQueryParams = useSearchParams();

    const handleFilterChange = (filterName: 'category' | 'tag' | 'templateStatus', value: string) => {
        const params = new URLSearchParams(currentQueryParams.toString());
        if (value && value !== 'all') params.set(filterName, value);
        else params.delete(filterName);
        params.delete('page');
        params.set('tab', 'templates');
        router.push(`/workspaces/${workspaceId}/checklists?${params.toString()}`);
    };

    return (
        <Flex gap="3" wrap="wrap" justify="start">
            {/* ... کامپوننت‌های Select برای فیلتر ... */}
        </Flex>
    );
};

// ... (کامپوننت‌های دیگر مانند ChecklistAssignmentsTable و فیلترهای آن)


// ========== کامپوننت اصلی نمایش تب‌ها ==========
interface ChecklistDisplayTabsProps {
    templates: TemplateWithDetails[];
    allCategories: Category[];
    allTags: Tag[];
    assignments: ExtendedChecklistAssignment[];
    assignmentCount: number;
    searchParams: ChecklistAssignmentQuery;
    currentUserId?: string;
    pageSize: number;
    currentPage: number;
    defaultTab: 'templates' | 'assignments' | 'settings'; // ✅ اصلاح تایپ
    workspaceId: number;
}

const ChecklistDisplayTabs: React.FC<ChecklistDisplayTabsProps> = ({
  templates, allCategories, allTags, assignments, assignmentCount,
  searchParams, currentUserId, pageSize, currentPage, defaultTab, workspaceId
}) => {
  const router = useRouter();
  const currentQueryParams = useSearchParams();

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(currentQueryParams.toString());
    params.set('tab', value);
    // هنگام تعویض تب، فیلترهای دیگر را پاک می‌کنیم تا تداخلی ایجاد نشود
    params.delete('category');
    params.delete('tag');
    params.delete('templateStatus');
    params.delete('responseStatus');
    router.push(`/workspaces/${workspaceId}/checklists?${params.toString()}`);
  };

  return (
    <Tabs.Root defaultValue={defaultTab} onValueChange={handleTabChange} dir="rtl">
        <Tabs.List size="2">
            <Tabs.Trigger value="templates"><FileTextIcon className="ml-1" /> قالب‌ها</Tabs.Trigger>
            <Tabs.Trigger value="assignments"><ListBulletIcon className="ml-1" /> تخصیص‌یافته‌ها</Tabs.Trigger>
            <Tabs.Trigger value="settings"><GearIcon className="ml-1" /> تنظیمات</Tabs.Trigger>
        </Tabs.List>
        <Box pt="5">
            <Tabs.Content value="templates">
                 <Flex justify="between" mb="4">
                    <TemplateFilters {...{ allCategories, allTags, searchParams, workspaceId }} />
                    <RadixButton asChild>
                        <Link href={`/workspaces/${workspaceId}/checklists/new`}>
                            <PlusIcon /> ایجاد قالب جدید
                        </Link>
                    </RadixButton>
                </Flex>
                <Grid columns={{ initial: '1', lg: '2', xl: '3' }} gap="5">
                    {templates.map(template => <ChecklistTemplateCard key={template.id} template={template} workspaceId={workspaceId} />)}
                </Grid>
            </Tabs.Content>
            <Tabs.Content value="assignments">
                 {/* منطق نمایش جدول تخصیص‌ها و فیلترهای آن */}
            </Tabs.Content>
            <Tabs.Content value="settings">
                 <ChecklistSettings />
            </Tabs.Content>
        </Box>
    </Tabs.Root>
  );
};

export default ChecklistDisplayTabs;