// app/checklists/templates/[templateId]/_components/TemplateDetailClientTabs.tsx
"use client";

import React from 'react';
import { Heading, Text, Box, Flex, Card, Separator, Button as RadixButton, Tabs, Badge, Tooltip } from '@radix-ui/themes';
import Link from 'next/link';
import { ChecklistItem, ChecklistTemplate as PrismaChecklistTemplate, User, Category, Tag, CategoryOnChecklistTemplates, TagOnChecklistTemplates } from '@prisma/client';
import AssignChecklistForm from './AssignChecklistForm';
import EditTemplateDetailsForm from './EditTemplateDetailsForm';
import { EyeOpenIcon, Pencil1Icon, CalendarIcon, ReaderIcon, BookmarkIcon } from '@radix-ui/react-icons';
import { useRouter, useSearchParams } from 'next/navigation';

// ========== تعریف تایپ‌ها (Types) ==========
// این تایپ‌ها برای اطمینان از ارسال داده‌های صحیح از کامپوننت سرور به این کامپوننت کلاینت استفاده می‌شوند.
// این تایپ‌ها ساختار جدول واسط صریح را منعکس می‌کنند.

export type ChecklistTemplateFull = PrismaChecklistTemplate & {
  items: ChecklistItem[];
  categories: (CategoryOnChecklistTemplates & { category: Pick<Category, 'id' | 'name'> })[];
  tags: (TagOnChecklistTemplates & { tag: Pick<Tag, 'id' | 'name' | 'color'> })[];
};

interface TemplateDetailClientTabsProps {
  template: ChecklistTemplateFull;
  allUsers: Pick<User, 'id' | 'name' | 'email'>[];
  allCategories: Pick<Category, 'id' | 'name'>[];
  allTags: Pick<Tag, 'id' | 'name' | 'color'>[];
  defaultTab: 'view' | 'edit' | 'assign';
}

// ========== کامپوننت اصلی ==========
const TemplateDetailClientTabs: React.FC<TemplateDetailClientTabsProps> = ({
  template,
  allUsers,
  allCategories,
  allTags,
  defaultTab,
}) => {
  const router = useRouter();
  const currentSearchParams = useSearchParams();

  // تابعی برای تغییر تب که URL را نیز به‌روز می‌کند
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(currentSearchParams.toString());
    params.set('tab', value);
    // برای جلوگیری از پرش صفحه هنگام تغییر تب، از scroll: false استفاده می‌کنیم
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
        {/* === تب مشاهده الگو === */}
        <Tabs.Content value="view">
          <Card variant="surface" className="shadow-lg rounded-lg dark:bg-gray-800/80 backdrop-blur-sm">
            <Box p="5">
              <Flex justify="between" align="start">
                <Heading as="h2" size="6" mb="2" className="text-gray-800 dark:text-gray-100 border-b pb-2 dark:border-gray-700">
                  {template.title}
                </Heading>
                {!template.isActive && <Badge color="gray" variant="solid" radius="full">آرشیو شده</Badge>}
              </Flex>
              <Text as="p" color="gray" size="3" mb="4" className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {template.description || 'بدون توضیحات.'}
              </Text>

              {template.categories.length > 0 && (
                <Flex align="center" gap="2" mb="2">
                  <Text weight="bold" size="2" className="text-gray-600 dark:text-gray-300">دسته‌بندی‌ها:</Text>
                  <Flex wrap="wrap" gap="1">
                    {template.categories.map(c => <Badge key={c.categoryId} color="purple" variant="soft" radius="full">{c.category.name}</Badge>)}
                  </Flex>
                </Flex>
              )}
              {template.tags.length > 0 && (
                <Flex align="center" gap="2" mb="4">
                  <Text weight="bold" size="2" className="text-gray-600 dark:text-gray-300">برچسب‌ها:</Text>
                  <Flex wrap="wrap" gap="1">
                    {template.tags.map(t => <Badge key={t.tagId} color={t.tag.color as any} variant="soft" radius="full">{t.tag.name}</Badge>)}
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
          <Box p={{initial: "0", sm: "5"}} className="bg-white dark:bg-gray-800/50 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
              <Heading as="h3" size="5" mb="4" className="text-gray-700 dark:text-gray-200 text-center sm:text-right">تخصیص این الگو به کاربر</Heading>
              <AssignChecklistForm templateId={template.id} users={allUsers} />
          </Box>
        </Tabs.Content>
      </Box>
    </Tabs.Root>
  );
};

export default TemplateDetailClientTabs;
