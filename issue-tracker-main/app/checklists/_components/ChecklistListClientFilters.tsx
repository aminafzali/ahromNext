// app/checklists/_components/ChecklistListClientFilters.tsx
"use client";

import { Select, Button as RadixButton, Flex } from "@radix-ui/themes";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
// اگر TagIcon همچنان خطا می‌دهد، آن را با BookmarkIcon یا آیکون مناسب دیگری جایگزین کنید
import { MixerHorizontalIcon, ReaderIcon, BookmarkIcon } from "@radix-ui/react-icons";
import { ChecklistAssignmentQuery, ResponseFilterStatus } from "../list/page"; 
import { Category, Tag } from "@prisma/client";

const ResponseStatusFilter = ({ currentFilter }: { currentFilter?: ResponseFilterStatus }) => {
  const router = useRouter();
  const searchParamsHook = useSearchParams();

  const onFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParamsHook.toString());
    if (value && value !== 'all') {
      params.set('responseStatus', value);
    } else {
      params.delete('responseStatus');
    }
    params.delete('page');
    params.set('tab', 'assignments');
    router.push(`/checklists/list?${params.toString()}`);
  };

  return (
    <Select.Root defaultValue={currentFilter || 'all'} onValueChange={onFilterChange}>
      <Select.Trigger radius="full" placeholder="وضعیت پاسخ..." />
      <Select.Content>
        <Select.Item value="all">همه وضعیت‌ها</Select.Item>
        <Select.Item value="open">باز (جدید یا در حال انجام)</Select.Item>
        <Select.Item value="completed">تکمیل شده (بدون مشکل)</Select.Item>
        <Select.Item value="needsReview">نیاز به بررسی (دارای آیتم غیرقابل قبول)</Select.Item>
      </Select.Content>
    </Select.Root>
  );
};

interface ClientFiltersProps {
    searchParams: ChecklistAssignmentQuery;
    allCategories: Pick<Category, 'id' | 'name'>[];
    allTags: Pick<Tag, 'id' | 'name'>[];
}

const ChecklistListClientFilters = ({ searchParams, allCategories, allTags }: ClientFiltersProps) => {
  const router = useRouter();
  const currentQueryParams = useSearchParams();

  const handleFilterChange = (filterName: 'assignedToUserId' | 'category' | 'tag', value: string) => {
    const params = new URLSearchParams(currentQueryParams.toString());
    if (value && value !== 'all') {
      params.set(filterName, value);
    } else {
      params.delete(filterName);
    }
    params.delete('page');
    params.set('tab', 'assignments');
    router.push(`/checklists/list?${params.toString()}`);
  };
  
  return (
    <Flex gap="3" align="center" wrap="wrap" mt="0" mb="0" className="dir-rtl">
      <ResponseStatusFilter currentFilter={searchParams.responseStatus} />
      
      <Select.Root 
        value={searchParams.category || 'all'} 
        onValueChange={(value) => handleFilterChange('category', value)}
      >
        <Select.Trigger radius="full" placeholder="دسته‌بندی الگو...">
            <ReaderIcon />
        </Select.Trigger>
        <Select.Content>
            <Select.Item value="all">همه دسته‌بندی‌ها</Select.Item>
            {allCategories.map(cat => (
                <Select.Item key={cat.id} value={cat.name}>{cat.name}</Select.Item>
            ))}
        </Select.Content>
      </Select.Root>

      <Select.Root 
        value={searchParams.tag || 'all'} 
        onValueChange={(value) => handleFilterChange('tag', value)}
      >
        <Select.Trigger radius="full" placeholder="برچسب الگو...">
            {/* در صورت عدم وجود TagIcon، از BookmarkIcon استفاده کنید */}
                 <BookmarkIcon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 mt-px" />
            {/* <BookmarkIcon /> */}
        </Select.Trigger>
        <Select.Content>
            <Select.Item value="all">همه برچسب‌ها</Select.Item>
            {allTags.map(tag => (
                <Select.Item key={tag.id} value={tag.name}>{tag.name}</Select.Item>
            ))}
        </Select.Content>
      </Select.Root>

      <RadixButton 
        variant={searchParams.assignedToUserId === 'me' ? "solid" : "soft"}
        onClick={() => handleFilterChange('assignedToUserId', searchParams.assignedToUserId === 'me' ? 'all' : 'me')}
        radius="full"
      >
        <MixerHorizontalIcon />
        {searchParams.assignedToUserId === 'me' ? "نمایش همه کاربران" : "فقط اختصاص یافته به من"}
      </RadixButton>
    </Flex>
  );
};

export default ChecklistListClientFilters;
