// app/checklists/list/_components/ChecklistDisplayTabs.tsx
"use client";

import React from "react";
import { Flex, Grid, Heading, Text, Card, Box, Button as RadixButton, Tabs, Table, Badge, Select, HoverCard, Tooltip } from "@radix-ui/themes";
import Link from "next/link";
import NextLink from 'next/link';
import { ArrowUpIcon, EyeOpenIcon, Pencil2Icon, FileTextIcon, ListBulletIcon, PlusIcon, ReaderIcon, BookmarkIcon, GearIcon, CalendarIcon } from "@radix-ui/react-icons";
import ChecklistListClientFilters from "@/app/checklists/_components/ChecklistListClientFilters";
import Pagination from "@/app/components/Pagination";
import { ChecklistTemplate, ResponseStatus, Category, Tag, ChecklistAssignment } from "@prisma/client";
import { ExtendedChecklistAssignment, ChecklistAssignmentQuery, TemplateWithDetails } from "../page";
import { useRouter, useSearchParams } from "next/navigation";
import ChecklistSettings from "./ChecklistSettings";
import CategoryTreeView from "./CategoryTreeView";

// پراپ‌های کامپوننت
interface ChecklistDisplayTabsProps {
  templates: TemplateWithDetails[];
  allCategories: Category[];
  allTags: Pick<Tag, 'id' | 'name' | 'color'>[];
  assignments: ExtendedChecklistAssignment[];
  assignmentCount: number;
  searchParams: ChecklistAssignmentQuery;
  currentUserId: string | undefined;
  pageSize: number;
  currentPage: number;
  defaultTab: 'templates' | 'assignments' | 'settings';
}

// کامپوننت کارت الگو
const ChecklistTemplateCard = ({ template }: { template: TemplateWithDetails }) => {
  return (
    <Card variant="classic" className="hover:shadow-lg transition-shadow duration-200 dir-rtl border border-gray-200 dark:border-gray-700 rounded-lg">
      <Flex direction="column" justify="between" style={{ height: '100%' }} gap="3">
        <Box>
          <Flex justify="between" align="center">
            <Heading as="h3" size="4" mb="1" trim="start" className="text-right">
              <Link href={`/checklists/templates/${template.id}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                {template.title}
              </Link>
            </Heading>
            {!template.isActive && <Badge color="gray" variant="soft">آرشیو شده</Badge>}
          </Flex>
          <Text as="p" size="2" color="gray" className="line-clamp-3 text-right mb-2">
            {template.description || "بدون توضیحات"}
          </Text>
          
          {template.categories && template.categories.length > 0 && (
            <Flex wrap="wrap" gap="1" mb="1" justify="end" className="mt-2">
                <Tooltip content="دسته‌بندی‌ها">
                    <ReaderIcon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 mt-px" />
                </Tooltip>
              {template.categories.map(category => (
                <Badge key={category.id} color="purple" variant="soft" radius="full" size="1">
                  {category.name}
                </Badge>
              ))}
            </Flex>
          )}
          {template.tags && template.tags.length > 0 && (
            <Flex wrap="wrap" gap="1" justify="end" className="mt-1">
                <Tooltip content="برچسب‌ها">
                    <BookmarkIcon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 mt-px" />
                </Tooltip>
              {template.tags.map(tag => (
                <Badge key={tag.id} color={tag.color as any} variant="soft" radius="full" size="1">
                  {tag.name}
                </Badge>
              ))}
            </Flex>
          )}
        </Box>
        <Flex mt="3" justify="start" align="center" gap="2">
          <RadixButton asChild variant="soft" size="1">
            <Link href={`/checklists/templates/${template.id}`}>
                <EyeOpenIcon className="ml-1 rtl:mr-1 rtl:ml-0" /> مشاهده و تخصیص
            </Link>
          </RadixButton>
           <Text size="1" color="gray" className="self-center mr-auto">
             {template._count.items} آیتم
           </Text>
        </Flex>
      </Flex>
    </Card>
  );
};

// ستون‌های جدول
const assignmentTableColumns: {
  label: string;
  value?: ChecklistAssignmentQuery['orderBy'] | 'dueDate';
  className?: string;
  isSortable?: boolean;
}[] = [
  { label: 'نام الگو', value: 'templateTitle', isSortable: true, className: 'text-right' },
  { label: 'دسته‌بندی/برچسب الگو', value: undefined, className: 'hidden lg:table-cell text-right', isSortable: false },
  { label: 'اختصاص به', value: 'assignedToUserName', className: 'hidden md:table-cell text-right', isSortable: true },
  { label: 'تاریخ تخصیص', value: 'assignedAt', className: 'hidden md:table-cell text-right', isSortable: true },
  { label: 'تاریخ سررسید', value: 'dueDate', className: 'hidden md:table-cell text-right', isSortable: true },
  { label: 'وضعیت پاسخ', value: undefined, className: 'hidden md:table-cell text-center', isSortable: false },
  { label: 'عملیات', value: undefined, isSortable: false, className: 'text-left' },
];

// کامپوننت جدول تخصیص‌ها
const ChecklistAssignmentsTable = ({
  assignments,
  searchParams,
  currentUserId,
}: {
  assignments: ExtendedChecklistAssignment[];
  searchParams: ChecklistAssignmentQuery;
  currentUserId: string | undefined;
}) => {
  const getAssignmentStatus = (assignment: ExtendedChecklistAssignment): { text: string; color: "gray" | "blue" | "green" | "red" } => {
    const totalTemplateItems = assignment.template._count.items;
    if (totalTemplateItems === 0) return { text: "الگو خالی", color: "gray" };
    const unacceptableItems = assignment.responses.filter(r => r.status === ResponseStatus.UNACCEPTABLE).length;
    if (unacceptableItems > 0) return { text: "نیاز به بررسی", color: "red"};
    const noneItems = assignment.responses.filter(r => r.status === ResponseStatus.NONE).length;
    if (noneItems === totalTemplateItems) return { text: "جدید", color: "gray" };
    if (noneItems > 0) return { text: "در حال انجام", color: "blue" };
    return { text: "تکمیل شده", color: "green" };
  };

  return (
    <Table.Root variant="surface" className="dir-rtl rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <Table.Header className="bg-gray-50 dark:bg-gray-800">
        <Table.Row>
          {assignmentTableColumns.map((column) => (
            <Table.ColumnHeaderCell key={column.label} className={`${column.className} py-3 px-4 font-semibold`}>
              {column.isSortable && column.value ? (
                <NextLink href={{ pathname: '/checklists/list', query: { ...searchParams, orderBy: column.value } }} className="hover:text-blue-600 dark:hover:text-blue-400">
                  {column.label}
                  {column.value === searchParams.orderBy && (<ArrowUpIcon className="inline mr-1 rtl:ml-1 rtl:mr-0 w-4 h-4" />)}
                </NextLink>
              ) : ( column.label )}
            </Table.ColumnHeaderCell>
          ))}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {assignments.map((assignment, index) => {
          const status = getAssignmentStatus(assignment);
          const templateCategories = assignment.template.categories || [];
          const templateTags = assignment.template.tags || [];

          return (
            <Table.Row key={assignment.id} className={`hover:bg-gray-100 dark:hover:bg-gray-700 ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
              <Table.Cell className="text-right py-3 px-4">
                <Link href={`/checklists/templates/${assignment.template.id}`} className="hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                  {assignment.template.title}
                </Link>
                 <Box className="md:hidden mt-1 text-right">
                    {templateCategories.length > 0 && templateCategories.slice(0,1).map(cat => <Badge key={cat.id} color="purple" variant="soft" radius="full" size="1" mr="1">{cat.name}</Badge>)}
                    {templateTags.length > 0 && templateTags.slice(0,1).map(tag => <Badge key={tag.id} color={tag.color as any} variant="soft" radius="full" size="1">{tag.name}</Badge>)}
                 </Box>
                 <Text as="p" size="1" color="gray" className="md:hidden text-right">به: {assignment.assignedToUser?.name || assignment.assignedToUser?.email || "نامشخص"}</Text>
                 <Text as="p" size="1" color="gray" className="md:hidden text-right">سررسید: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString('fa-IR') : 'ندارد'}</Text>
                 <Box className="md:hidden mt-1 text-right"><Badge color={status.color} radius="full">{status.text}</Badge></Box>
              </Table.Cell>
              <Table.Cell className="hidden lg:table-cell text-right py-3 px-4">
                <Flex direction="column" gap="1">
                  {templateCategories.map(cat => <Badge key={cat.id} color="purple" variant="soft">{cat.name}</Badge>)}
                  {templateTags.map(tag => <Badge key={tag.id} color={tag.color as any} variant="soft">{tag.name}</Badge>)}
                  {(templateCategories.length === 0 && templateTags.length === 0) && '-'}
                </Flex>
              </Table.Cell>
              <Table.Cell className="hidden md:table-cell text-right py-3 px-4">{assignment.assignedToUser?.name || assignment.assignedToUser?.email || "نامشخص"}</Table.Cell>
              <Table.Cell className="hidden md:table-cell text-right py-3 px-4">{new Date(assignment.assignedAt).toLocaleDateString('fa-IR')}</Table.Cell>
              <Table.Cell className="hidden md:table-cell text-right py-3 px-4">
                {assignment.dueDate ? <Flex align="center" gap="2" justify="end"><CalendarIcon className="text-gray-500"/>{new Date(assignment.dueDate).toLocaleDateString('fa-IR')}</Flex> : '-'}
              </Table.Cell>
              <Table.Cell className="hidden md:table-cell text-center py-3 px-4"><Badge color={status.color} radius="full">{status.text}</Badge></Table.Cell>
              <Table.Cell className="text-left py-3 px-4">
                <Tooltip content={assignment.assignedToUserId === currentUserId ? "پاسخ به چک‌لیست" : "مشاهده چک‌لیست"}>
                    <RadixButton asChild variant={assignment.assignedToUserId === currentUserId ? "soft" : "outline"} color={assignment.assignedToUserId === currentUserId ? "blue" : "gray"} size="1">
                        <Link href={assignment.assignedToUserId === currentUserId ? `/checklists/assignments/${assignment.id}/respond` : `/checklists/assignments/${assignment.id}/view`}>
                        {assignment.assignedToUserId === currentUserId ? <Pencil2Icon width="12" height="12" className="ml-1 rtl:mr-1 rtl:ml-0" /> : <EyeOpenIcon width="12" height="12" className="ml-1 rtl:mr-1 rtl:ml-0" /> }
                        {assignment.assignedToUserId === currentUserId ? "پاسخ" : "مشاهده"}
                        </Link>
                    </RadixButton>
                </Tooltip>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
};

// کامپوننت فیلترهای الگو
const TemplateFilters = ({ 
    allCategories, 
    allTags,
    currentCategory,
    currentTag,
    currentStatus
}: { 
    allCategories: Pick<Category, 'id' | 'name'>[];
    allTags: Pick<Tag, 'id' | 'name' | 'color'>[];
    currentCategory?: string;
    currentTag?: string;
    currentStatus?: 'active' | 'archived' | 'all';
}) => {
    const router = useRouter();
    const currentQueryParams = useSearchParams();

    const handleFilterChange = (filterName: 'category' | 'tag' | 'templateStatus', value: string) => {
        const params = new URLSearchParams(currentQueryParams.toString());
        if (value && value !== 'all') {
            params.set(filterName, value);
        } else {
            params.delete(filterName);
        }
        params.delete('page');
        params.set('tab', 'templates');
        router.push(`/checklists/list?${params.toString()}`);
    };

    return (
        <Flex gap="3" wrap="wrap" justify="start" className="dir-rtl">
            <Select.Root value={currentCategory || 'all'} onValueChange={(value) => handleFilterChange('category', value)}>
                <Select.Trigger radius="full" placeholder="دسته‌بندی..." />
                <Select.Content>
                    <Select.Item value="all">همه دسته‌بندی‌ها</Select.Item>
                    {allCategories.map(cat => (
                        <Select.Item key={cat.id} value={cat.name}>{cat.name}</Select.Item>
                    ))}
                </Select.Content>
            </Select.Root>
            <Select.Root value={currentTag || 'all'} onValueChange={(value) => handleFilterChange('tag', value)}>
                <Select.Trigger radius="full" placeholder="برچسب..." />
                <Select.Content>
                    <Select.Item value="all">همه برچسب‌ها</Select.Item>
                    {allTags.map(tag => (
                        <Select.Item key={tag.id} value={tag.name}>{tag.name}</Select.Item>
                    ))}
                </Select.Content>
            </Select.Root>
            <Select.Root value={currentStatus || 'active'} onValueChange={(value) => handleFilterChange('templateStatus', value)}>
                <Select.Trigger radius="full" placeholder="وضعیت الگو..." />
                <Select.Content>
                    <Select.Item value="active">فعال</Select.Item>
                    <Select.Item value="archived">آرشیو شده</Select.Item>
                    <Select.Item value="all">همه</Select.Item>
                </Select.Content>
            </Select.Root>
        </Flex>
    );
};


const ChecklistDisplayTabs: React.FC<ChecklistDisplayTabsProps> = ({
  templates,
  allCategories,
  allTags,
  assignments,
  assignmentCount,
  searchParams,
  currentUserId,
  pageSize,
  currentPage,
  defaultTab,
}) => {
  const router = useRouter();
  const currentQueryParams = useSearchParams();

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(currentQueryParams.toString());
    params.set('tab', value);
    router.push(`/checklists/list?${params.toString()}`);
  };

  return (
    <Tabs.Root defaultValue={defaultTab} onValueChange={handleTabChange} dir="rtl">
      <Tabs.List size="2" className="border-b border-gray-300 dark:border-gray-700">
        <Tabs.Trigger value="templates" className="px-4 py-2.5 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:dark:text-blue-400 data-[state=active]:border-b-2">
          <Flex align="center" gap="2"><FileTextIcon /> قالب‌های چک‌لیست</Flex>
        </Tabs.Trigger>
        <Tabs.Trigger value="assignments" className="px-4 py-2.5 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:dark:text-blue-400 data-[state=active]:border-b-2">
           <Flex align="center" gap="2"><ListBulletIcon /> چک‌لیست‌های اختصاص داده شده</Flex>
        </Tabs.Trigger>
        <Tabs.Trigger value="settings" className="px-4 py-2.5 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:dark:text-blue-400 data-[state=active]:border-b-2">
           <Flex align="center" gap="2"><GearIcon /> تنظیمات</Flex>
        </Tabs.Trigger>
      </Tabs.List>

      <Box pt="5">
        <Tabs.Content value="templates">
          <Grid columns={{ initial: '1', md: '280px 1fr' }} gap="6" className="dir-rtl">
            <aside className="border-l border-gray-200 dark:border-gray-700 pl-4 rtl:pr-0 rtl:pl-4 rtl:border-l-0 rtl:border-r">
                <Heading as="h3" size="4" mb="4" className="text-right">دسته‌بندی‌ها</Heading>
                <CategoryTreeView categories={allCategories} selectedCategory={searchParams.category} />
            </aside>

            <main>
                <Flex direction="column" gap="4">
                    <Flex direction={{initial: "column-reverse", sm: "row"}} justify="between" align={{initial: "stretch", sm: "center"}} gap={{initial: "3", sm: "4"}} mb="4">
                        <TemplateFilters 
                            allCategories={allCategories} 
                            allTags={allTags} 
                            currentCategory={searchParams.category}
                            currentTag={searchParams.tag}
                            currentStatus={searchParams.templateStatus}
                        />
                         <RadixButton asChild className="w-full sm:w-auto shrink-0">
                            <Link href="/checklists/new"><PlusIcon className="mr-1 rtl:ml-1 rtl:mr-0" /> اضافه کردن قالب</Link>
                         </RadixButton>
                    </Flex>
                    {templates.length === 0 && (
                      <Text color="gray" className="text-center py-10 text-lg font-medium">هیچ قالب چک‌لیستی با فیلترهای انتخابی یافت نشده است.</Text>
                    )}
                    <Grid columns={{ initial: '1', sm: '1', lg: '2', xl: '3' }} gap="5">
                      {templates.map((template) => (
                        <ChecklistTemplateCard key={template.id} template={template as TemplateWithDetails & {isActive: boolean}} />
                      ))}
                    </Grid>
                </Flex>
            </main>
          </Grid>
        </Tabs.Content>

        <Tabs.Content value="assignments">
          <Box>
            <Flex direction={{initial: 'column', sm: 'row'}} justify="end" align={{initial: 'stretch', sm: 'center'}} gap="3" mb="4">
                <ChecklistListClientFilters 
                    searchParams={searchParams} 
                    allCategories={allCategories}
                    allTags={allTags}
                />
            </Flex>

            {assignments.length === 0 && (
               <Box mt="3" style={{ display: 'block' }} className="text-center py-10 text-lg font-medium">
                <Text color="gray">هیچ چک‌لیستی با فیلترهای انتخابی یافت نشد.</Text>
               </Box>
            )}
            {assignments.length > 0 && (
              <>
                <ChecklistAssignmentsTable
                  assignments={assignments}
                  searchParams={searchParams} 
                  currentUserId={currentUserId}
                />
                <Flex justify="center" mt="4">
                  <Pagination
                    itemCount={assignmentCount}
                    pageSize={pageSize}
                    currentPage={currentPage}
                  />
                </Flex>
              </>
            )}
          </Box>
        </Tabs.Content>
        
        <Tabs.Content value="settings">
            <ChecklistSettings />
        </Tabs.Content>
      </Box>
    </Tabs.Root>
  );
};

export default ChecklistDisplayTabs;
