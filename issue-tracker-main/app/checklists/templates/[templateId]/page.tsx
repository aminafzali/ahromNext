// app/checklists/templates/[templateId]/page.tsx
import prisma from '@/prisma/client';
import { notFound } from 'next/navigation';
import React from 'react';
import { Heading, Text, Box, Flex, Card, Separator, Button as RadixButton, Select, Callout } from '@radix-ui/themes';
import { ChecklistItem, ChecklistTemplate as PrismaChecklistTemplate, User } from '@prisma/client';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import AssignChecklistForm from './_components/AssignChecklistForm'; // کامپوننت فرم تخصیص

// تایپ برای الگو همراه با آیتم‌هایش
type ChecklistTemplateWithItems = PrismaChecklistTemplate & {
  items: ChecklistItem[];
};

interface Props {
  params: { templateId: string };
}

const ChecklistTemplateDetailPage = async ({ params }: Props) => {
  const session = await getServerSession(authOptions);
  // اگر نیاز به احراز هویت برای مشاهده این صفحه است:
  // if (!session) {
  //   // redirect('/api/auth/signin'); یا نمایش پیام خطا
  //   return <Callout.Root color="red">برای مشاهده این صفحه باید وارد شوید.</Callout.Root>;
  // }

  const templateId = parseInt(params.templateId);
  if (isNaN(templateId)) {
    notFound();
  }

  const template = await prisma.checklistTemplate.findUnique({
    where: { id: templateId },
    include: {
      items: {
        orderBy: { order: 'asc' }, // نمایش آیتم‌ها به ترتیب order
      },
    },
  });

  if (!template) {
    notFound();
  }

  // خواندن لیست کاربران برای dropdown تخصیص
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  });

  return (
    <Flex direction={{ initial: 'column', md: 'row' }} gap="5" className="p-4 md:p-6">
      <Box className="md:w-2/3">
        <Heading as="h1" size="7" mb="2">
          {template.title}
        </Heading>
        <Text as="p" color="gray" size="3" mb="4">
          {template.description || 'بدون توضیحات.'}
        </Text>

        <Separator my="4" size="4" />

        <Heading as="h2" size="5" mb="3">
          آیتم‌های الگو ({template.items.length})
        </Heading>
        {template.items.length === 0 && <Text color="gray">این الگو هنوز آیتمی ندارد.</Text>}
        <Flex direction="column" gap="3">
          {template.items.map((item, index) => (
            <Card key={item.id} variant="surface">
              <Flex direction="column" gap="1">
                <Text weight="bold">
                  {index + 1}. {item.title}
                </Text>
                {item.description && (
                  <Text size="2" color="gray">
                    {item.description}
                  </Text>
                )}
              </Flex>
            </Card>
          ))}
        </Flex>
      </Box>

      <Box className="md:w-1/3">
        <Card>
          <Heading as="h3" size="4" mb="3">
            تخصیص این الگو
          </Heading>
          {/* کامپوننت فرم تخصیص در اینجا قرار می‌گیرد */}
          <AssignChecklistForm templateId={template.id} users={users} />
        </Card>
        <Flex mt="4" justify="start">
            <RadixButton variant="soft" color="gray" asChild>
                <Link href="/checklists/list">بازگشت به لیست الگوها</Link>
            </RadixButton>
        </Flex>
      </Box>
    </Flex>
  );
};

export default ChecklistTemplateDetailPage;



