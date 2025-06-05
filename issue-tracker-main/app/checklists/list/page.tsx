// app/checklists/list/page.tsx
import React from "react";
import prisma from "@/prisma/client";
import { Flex, Grid, Heading, Text, Card, Box, Button as RadixButton } from "@radix-ui/themes";
import Link from "next/link";
import { getServerSession } from "next-auth";
import authOptions from "@/app/auth/authOptions"; // مسیر authOptions خود را تنظیم کنید
import { ChecklistAssignment, ChecklistTemplate, User, ResponseStatus, Prisma } from "@prisma/client";
import ChecklistActions from "@/app/checklists/_components/ChecklistActions"; // مسیر کامپوننت اکشن‌ها
import Pagination from "@/app/components/Pagination"; // مسیر کامپوننت صفحه‌بندی
import NextLink from 'next/link';
import { Table, Badge } from '@radix-ui/themes';
import { ArrowUpIcon, EyeOpenIcon, Pencil2Icon } from "@radix-ui/react-icons";
import ChecklistListClientFilters from "@/app/checklists/_components/ChecklistListClientFilters"; // ایمپورت کامپوننت فیلترها

// تایپ برای الگو با تعداد آیتم‌ها
type TemplateWithItemCount = Pick<ChecklistTemplate, 'id' | 'title'> & {
  _count: { items: number };
};

// تایپ برای داده‌های کامل‌تر چک‌لیست اختصاص داده شده
// این تایپ در کامپوننت ChecklistAssignmentsTable استفاده می‌شود و می‌تواند همینجا بماند یا به فایل تایپ‌های مشترک منتقل شود.
export type ExtendedChecklistAssignment = ChecklistAssignment & {
  template: TemplateWithItemCount;
  assignedToUser: Pick<User, 'id' | 'name' | 'email'> | null;
  responses: { status: ResponseStatus }[];
};

// وضعیت‌های فیلتر (این تایپ باید از اینجا export شود تا در کامپوننت کلاینت قابل استفاده باشد)
const responseStatuses = ['all', 'open', 'completed', 'needsReview'] as const;
export type ResponseFilterStatus = typeof responseStatuses[number];

// تایپ برای پارامترهای جستجو (این تایپ باید از اینجا export شود)
export interface ChecklistAssignmentQuery {
  responseStatus?: ResponseFilterStatus;
  orderBy?: keyof Pick<ExtendedChecklistAssignment, 'assignedAt' | 'id'> | 'templateTitle' | 'assignedToUserName';
  page?: string;
  assignedToUserId?: string; // می‌تواند 'me' یا یک userId یا 'all' باشد
}

interface Props {
  searchParams: ChecklistAssignmentQuery;
}

// کامپوننت برای نمایش کارت‌های الگو
const ChecklistTemplateCard = ({ template }: { template: Pick<ChecklistTemplate, 'id' | 'title' | 'description'> }) => {
  return (
    <Card variant="classic" style={{ height: '100%' }}>
      <Flex direction="column" justify="between" style={{ height: '100%' }}>
        <Box>
          <Heading as="h3" size="4" mb="2" trim="start">
            <Link href={`/checklists/templates/${template.id}`} className="hover:underline">
              {template.title}
            </Link>
          </Heading>
          <Text as="p" size="2" color="gray" className="line-clamp-3">
            {template.description || "بدون توضیحات"}
          </Text>
        </Box>
        <Flex mt="4" justify="end">
          <RadixButton asChild variant="soft">
            <Link href={`/checklists/templates/${template.id}`}>مشاهده و تخصیص</Link>
          </RadixButton>
        </Flex>
      </Flex>
    </Card>
  );
};

// ستون‌های جدول چک‌لیست‌های اختصاص داده شده
const assignmentTableColumns: {
  label: string;
  value: ChecklistAssignmentQuery['orderBy'];
  className?: string;
  isSortable?: boolean;
}[] = [
  { label: 'نام الگو', value: 'templateTitle', isSortable: true },
  { label: 'اختصاص به', value: 'assignedToUserName', className: 'hidden md:table-cell', isSortable: true },
  { label: 'تاریخ تخصیص', value: 'assignedAt', className: 'hidden md:table-cell', isSortable: true },
  { label: 'وضعیت پاسخ', value: undefined, className: 'hidden md:table-cell', isSortable: false },
  { label: 'عملیات', value: undefined, isSortable: false },
];

// کامپوننت برای جدول چک‌لیست‌های اختصاص داده شده
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
    <Table.Root variant="surface">
      <Table.Header>
        <Table.Row>
          {assignmentTableColumns.map((column) => (
            <Table.ColumnHeaderCell
              key={column.label}
              className={column.className}
            >
              {column.isSortable && column.value ? (
                <NextLink
                  href={{
                    pathname: '/checklists/list',
                    query: {
                      ...searchParams,
                      orderBy: column.value,
                    },
                  }}
                >
                  {column.label}
                </NextLink>
              ) : (
                column.label
              )}
              {column.isSortable && column.value === searchParams.orderBy && (
                <ArrowUpIcon className="inline ml-1 rtl:mr-1 rtl:ml-0" />
              )}
            </Table.ColumnHeaderCell>
          ))}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {assignments.map((assignment) => {
          const status = getAssignmentStatus(assignment);
          return (
            <Table.Row key={assignment.id}>
              <Table.Cell>
                <Link href={`/checklists/templates/${assignment.template.id}`} className="hover:underline">
                  {assignment.template.title}
                </Link>
                 <Text as="p" size="1" color="gray" className="md:hidden">به: {assignment.assignedToUser?.name || assignment.assignedToUser?.email || "نامشخص"}</Text>
                 <Text as="p" size="1" color="gray" className="md:hidden">تاریخ: {new Date(assignment.assignedAt).toLocaleDateString('fa-IR')}</Text>
                 <Box className="md:hidden mt-1"><Badge color={status.color}>{status.text}</Badge></Box>
              </Table.Cell>
              <Table.Cell className="hidden md:table-cell">
                {assignment.assignedToUser?.name || assignment.assignedToUser?.email || "نامشخص"}
              </Table.Cell>
              <Table.Cell className="hidden md:table-cell">
                {new Date(assignment.assignedAt).toLocaleDateString('fa-IR')}
              </Table.Cell>
              <Table.Cell className="hidden md:table-cell">
                 <Badge color={status.color}>{status.text}</Badge>
              </Table.Cell>
              <Table.Cell>
                {assignment.assignedToUserId === currentUserId ? (
                  <RadixButton asChild variant="soft" size="1">
                    <Link href={`/checklists/assignments/${assignment.id}/respond`}>
                      <Pencil2Icon width="12" height="12" className="mr-1 rtl:ml-1 rtl:mr-0" /> پاسخ
                    </Link>
                  </RadixButton>
                ) : (
                  <RadixButton asChild variant="outline" color="gray" size="1">
                    <Link href={`/checklists/assignments/${assignment.id}/view`}>
                       <EyeOpenIcon width="12" height="12" className="mr-1 rtl:ml-1 rtl:mr-0" /> مشاهده
                    </Link>
                  </RadixButton>
                )}
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  );
};

const ChecklistsListPage = async ({ searchParams }: Props) => {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;

  // خواندن الگوهای چک‌لیست
  const templates = await prisma.checklistTemplate.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, description: true } // فقط فیلدهای مورد نیاز برای کارت
  });

  // پارامترهای صفحه‌بندی و مرتب‌سازی برای چک‌لیست‌های اختصاص داده شده
  const page = parseInt(searchParams.page || '1') || 1;
  const pageSize = 10;

  let orderByClause: Prisma.ChecklistAssignmentOrderByWithRelationInput = { assignedAt: 'desc' };
  if (searchParams.orderBy) {
    if (searchParams.orderBy === 'templateTitle') {
      orderByClause = { template: { title: 'asc' } };
    } else if (searchParams.orderBy === 'assignedToUserName') {
      orderByClause = { assignedToUser: { name: 'asc' } }; 
    } else if (['assignedAt', 'id'].includes(searchParams.orderBy as string)) {
       orderByClause = { [searchParams.orderBy]: 'asc' };
    }
  }

  const whereClause: Prisma.ChecklistAssignmentWhereInput = {};
  if (searchParams.assignedToUserId === 'me' && currentUserId) {
    whereClause.assignedToUserId = currentUserId;
  } else if (searchParams.assignedToUserId && searchParams.assignedToUserId !== 'all' && searchParams.assignedToUserId !== 'me') {
    whereClause.assignedToUserId = searchParams.assignedToUserId;
  }

  if (searchParams.responseStatus && searchParams.responseStatus !== 'all') {
    switch (searchParams.responseStatus) {
      case 'open': 
        whereClause.AND = [
          ...(whereClause.AND as Prisma.ChecklistAssignmentWhereInput[] || []),
          { responses: { some: { status: ResponseStatus.NONE } } }, 
          { responses: { none: { status: ResponseStatus.UNACCEPTABLE } } }, 
        ];
        break;
      case 'completed': 
        whereClause.AND = [
          ...(whereClause.AND as Prisma.ChecklistAssignmentWhereInput[] || []),
          { responses: { every: { status: { not: ResponseStatus.NONE } } } }, 
          { responses: { none: { status: ResponseStatus.UNACCEPTABLE } } }, 
        ];
        break;
      case 'needsReview': 
        whereClause.responses = { some: { status: ResponseStatus.UNACCEPTABLE } };
        break;
    }
  }

  const assignments = await prisma.checklistAssignment.findMany({
    where: whereClause,
    include: {
      template: { select: { id: true, title: true, _count: { select: { items: true } } } },
      assignedToUser: { select: { id: true, name: true, email: true } },
      responses: { select: { status: true } }, 
    },
    orderBy: orderByClause,
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  const assignmentCount = await prisma.checklistAssignment.count({ where: whereClause });

  return (
    <Flex direction="column" gap="5" className="p-4 md:p-6">
      <ChecklistActions />

      <Box>
        <Heading as="h2" size="6" mb="4">
          قالب‌های چک‌لیست
        </Heading>
        {templates.length === 0 && (
          <Text color="gray">هنوز هیچ قالب چک‌لیستی ساخته نشده است.</Text>
        )}
        <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4">
          {templates.map((template) => (
            <ChecklistTemplateCard key={template.id} template={template} />
          ))}
        </Grid>
      </Box>

      <Box mt="6">
        <Flex direction={{initial: 'column', sm: 'row'}} justify="between" align={{initial: 'stretch', sm: 'center'}} gap="3" mb="3">
            <Heading as="h2" size="6">
            چک‌لیست‌های اختصاص داده شده
            </Heading>
            <ChecklistListClientFilters searchParams={searchParams} />
        </Flex>

        {assignments.length === 0 && (
           // اصلاح خطا: استفاده از Box به جای Text برای پراپرتی display
           <Box mt="3" style={{ display: 'block' }}>
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
                currentPage={page}
              />
            </Flex>
          </>
        )}
      </Box>
    </Flex>
  );
};

export const dynamic = 'force-dynamic'; 

export default ChecklistsListPage;
