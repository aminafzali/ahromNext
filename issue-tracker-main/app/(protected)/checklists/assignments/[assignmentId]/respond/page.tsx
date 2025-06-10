// app/checklists/assignments/[assignmentId]/respond/page.tsx
import prisma from '@/prisma/client';
import { notFound, redirect } from 'next/navigation';
import React from 'react';
import { Heading, Text, Box, Flex, Card, Separator, Button as RadixButton, Callout, Strong } from '@radix-ui/themes';
import { ChecklistAssignment, ChecklistItem, ChecklistTemplate, ResponseStatus as PrismaResponseStatus, User, Issue } from '@prisma/client';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import ChecklistRespondForm from './_components/ChecklistRespondForm'; // کامپوننت فرم پاسخ

// تایپ برای آیتم چک‌لیست همراه با پاسخ احتمالی آن
export type ChecklistItemWithResponse = ChecklistItem & {
  responses: { id: number; status: PrismaResponseStatus, assignmentId: number, issues: Pick<Issue, 'id' | 'title' | 'status'>[] }[]; // فقط پاسخ مربوط به این assignment
};

// تایپ برای تخصیص چک‌لیست با جزئیات کامل
export type FullChecklistAssignment = ChecklistAssignment & {
  template: ChecklistTemplate & {
    items: ChecklistItemWithResponse[];
  };
  assignedToUser: Pick<User, 'id' | 'name' | 'email'> | null;
};

interface Props {
  params: { assignmentId: string };
}

const RespondToChecklistPage = async ({ params }: Props) => {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect('/api/auth/signin?callbackUrl=' + encodeURIComponent(`/checklists/assignments/${params.assignmentId}/respond`));
  }
  const currentUserId = session.user.id;

  const assignmentId = parseInt(params.assignmentId);
  if (isNaN(assignmentId)) {
    notFound();
  }

  const assignment = await prisma.checklistAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      template: {
        include: {
          items: {
            orderBy: { order: 'asc' },
            include: {
              responses: { // فقط پاسخ‌های مربوط به همین تخصیص را می‌خواهیم
                where: { assignmentId: assignmentId },
                select: { id: true, status: true, assignmentId: true, issues: {select: {id: true, title: true, status: true}} }, // اضافه کردن issues
              },
            },
          },
        },
      },
      assignedToUser: { select: { id: true, name: true, email: true } },
    },
  });

  if (!assignment) {
    notFound();
  }

  if (assignment.assignedToUserId !== currentUserId) {
    return (
      <Flex direction="column" align="center" justify="center" className="p-6 min-h-[60vh]">
        <Callout.Root color="red" size="3">
          <Callout.Text>
            شما اجازه پاسخ به این چک‌لیست را ندارید. این چک‌لیست به کاربر دیگری اختصاص داده شده است.
          </Callout.Text>
        </Callout.Root>
        <RadixButton asChild mt="4">
          <Link href="/checklists/list">بازگشت به لیست چک‌لیست‌ها</Link>
        </RadixButton>
      </Flex>
    );
  }
  
  // تبدیل داده‌ها برای فرم
  const templateWithPopulatedResponses: FullChecklistAssignment['template'] = {
      ...assignment.template,
      items: assignment.template.items.map(item => ({
          ...item,
          // اطمینان از اینکه responses یک آرایه است و فقط پاسخ مربوط به این assignment را برمی‌گرداند (که query بالا این کار را می‌کند)
          // و اگر پاسخی نیست، status را NONE در نظر می‌گیریم (هرچند باید از قبل ایجاد شده باشد)
          responses: item.responses.length > 0 ? item.responses : [{ id: -1, status: PrismaResponseStatus.NONE, assignmentId: assignmentId, issues: [] }] 
      }))
  };


  return (
    <Box className="p-4 md:p-6 max-w-4xl mx-auto">
      <Flex justify="between" align="center" mb="3">
        <Heading as="h1" size="7">
          پاسخ به چک‌لیست: {assignment.template.title}
        </Heading>
        <RadixButton variant="soft" asChild>
            <Link href="/checklists/list">بازگشت به لیست</Link>
        </RadixButton>
      </Flex>
      <Text as="p" color="gray" size="3" mb="1">
        الگو: {assignment.template.title}
      </Text>
      <Text as="p" color="gray" size="3" mb="4">
        اختصاص یافته به: {assignment.assignedToUser?.name || assignment.assignedToUser?.email}
      </Text>
      <Separator my="4" size="4" />

      <ChecklistRespondForm
        assignmentId={assignment.id}
        template={templateWithPopulatedResponses}
        currentUserId={currentUserId}
      />
    </Box>
  );
};

export default RespondToChecklistPage;

