// app/checklists/templates/[templateId]/_components/TemplateDetailClientTabs.tsx
"use client";

import React from 'react';
import { Heading, Text, Box, Flex, Card, Separator, Button as RadixButton, Tabs, Badge } from '@radix-ui/themes';
import Link from 'next/link';
import { ChecklistItem, ChecklistTemplate as PrismaChecklistTemplate, User, Category, Tag } from '@prisma/client';
import AssignChecklistForm from './AssignChecklistForm'; // مسیر صحیح را بررسی کنید
import EditTemplateDetailsForm from './EditTemplateDetailsForm'; // مسیر صحیح را بررسی کنید
import { EyeOpenIcon, Pencil1Icon, CalendarIcon } from '@radix-ui/react-icons';
import { useRouter, useSearchParams } from 'next/navigation';

export type ChecklistTemplateFull = PrismaChecklistTemplate & {
  items: ChecklistItem[];
  categories: Pick<Category, 'id' | 'name'>[];
  tags: Pick<Tag, 'id' | 'name'>[];
};

interface TemplateDetailClientTabsProps {
  template: ChecklistTemplateFull;
  allUsers: Pick<User, 'id' | 'name' | 'email'>[];
  allCategories: Pick<Category, 'id' | 'name'>[];
  allTags: Pick<Tag, 'id' | 'name'>[];
  defaultTab: 'view' | 'edit' | 'assign';
}

const TemplateDetailClientTabs: React.FC<TemplateDetailClientTabsProps> = ({
  template,
  allUsers,
  allCategories,
  allTags,
  defaultTab,
}) => {
  const router = useRouter();
  const currentSearchParams = useSearchParams();

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(currentSearchParams.toString());
    params.set('tab', value);
    // برای جلوگیری از اسکرول به بالای صفحه هنگام تغییر تب، scroll: false اضافه شد
    router.push(`/checklists/templates/${template.id}?${params.toString()}`, { scroll: false });
  };

  return (
    <Tabs.Root defaultValue={defaultTab} onValueChange={handleTabChange} dir="rtl">
      <Tabs.List 
        size="2" 
        className="mb-5 border-b border-gray-300 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10 shadow-sm"
      >
        <Tabs.Trigger value="view" className="px-4 py-2.5 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:dark:text-blue-400 data-[state=active]:border-b-2">
          <Flex align="center" gap="2"><EyeOpenIcon /> مشاهده الگو</Flex>
        </Tabs.Trigger>
        <Tabs.Trigger value="edit" className="px-4 py-2.5 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:dark:text-blue-400 data-[state=active]:border-b-2">
          <Flex align="center" gap="2"><Pencil1Icon /> ویرایش جزئیات</Flex>
        </Tabs.Trigger>
        <Tabs.Trigger value="assign" className="px-4 py-2.5 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:dark:text-blue-400 data-[state=active]:border-b-2">
           <Flex align="center" gap="2"><CalendarIcon /> تخصیص الگو</Flex>
        </Tabs.Trigger>
      </Tabs.List>

      <Box pt="3">
        <Tabs.Content value="view">
          <Card variant="surface" className="shadow-md rounded-lg dark:bg-gray-800/80 backdrop-blur-sm">
            <Box p="5">
              <Heading as="h2" size="6" mb="2" className="text-gray-700 dark:text-gray-200 border-b pb-2 dark:border-gray-700">
                {template.title}
              </Heading>
              <Text as="p" color="gray" size="3" mb="4" className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {template.description || 'بدون توضیحات.'}
              </Text>

              {template.categories.length > 0 && (
                <Flex align="center" gap="2" mb="2">
                  <Text weight="bold" size="2" className="text-gray-600 dark:text-gray-300">دسته‌بندی‌ها:</Text>
                  <Flex wrap="wrap" gap="1">
                    {template.categories.map(cat => <Badge key={cat.id} color="purple" variant="soft" radius="full">{cat.name}</Badge>)}
                  </Flex>
                </Flex>
              )}
              {template.tags.length > 0 && (
                <Flex align="center" gap="2" mb="4">
                  <Text weight="bold" size="2" className="text-gray-600 dark:text-gray-300">برچسب‌ها:</Text>
                  <Flex wrap="wrap" gap="1">
                    {template.tags.map(tag => <Badge key={tag.id} color="teal" variant="soft" radius="full">{tag.name}</Badge>)}
                  </Flex>
                </Flex>
              )}
              
              <Separator my="4" size="4" className="dark:bg-gray-700" />

              <Heading as="h3" size="5" mb="3" className="text-gray-700 dark:text-gray-200">
                آیتم‌های الگو ({template.items.length})
              </Heading>
              {template.items.length === 0 && <Text color="gray" className="italic">این الگو هنوز آیتمی ندارد.</Text>}
              <Flex direction="column" gap="3">
                {template.items.map((item, index) => (
                  <Card key={item.id} variant="classic" className="bg-gray-50 dark:bg-gray-700/50 rounded-md">
                    <Box p="3">
                      <Text weight="bold" className="text-gray-800 dark:text-gray-100">
                        {index + 1}. {item.title}
                      </Text>
                      {item.description && (
                        <Text as="p" size="2" color="gray" mt="1" className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
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

        <Tabs.Content value="edit">
          <EditTemplateDetailsForm 
            template={template}
            allCategories={allCategories}
            allTags={allTags}
          />
        </Tabs.Content>

        <Tabs.Content value="assign">
          {/* اصلاح: حذف Card و تنظیم padding برای Box */}
          <Box p={{initial: "0", sm: "5"}} className="bg-white dark:bg-gray-800/50 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700"> {/* اضافه کردن استایل به Box */}
              <Heading as="h3" size="5" mb="4" className="text-gray-700 dark:text-gray-200 text-center sm:text-right">تخصیص این الگو به کاربر</Heading>
              <AssignChecklistForm templateId={template.id} users={allUsers} />
          </Box>
        </Tabs.Content>
      </Box>
    </Tabs.Root>
  );
};

export default TemplateDetailClientTabs;
