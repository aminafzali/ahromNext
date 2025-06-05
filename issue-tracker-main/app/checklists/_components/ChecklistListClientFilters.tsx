// app/checklists/_components/ChecklistListClientFilters.tsx
"use client";

import { Select, Button as RadixButton, Flex } from "@radix-ui/themes";
import { useRouter, useSearchParams } from "next/navigation"; // Import hooks
import React from "react";
import { MixerHorizontalIcon } from "@radix-ui/react-icons";
// مسیر import برای تایپ‌ها باید صحیح باشد. اگر page.tsx در پوشه list است، این مسیر درست است.
// اگر ساختار پوشه متفاوت است، این مسیر را تنظیم کنید.
import { ChecklistAssignmentQuery, ResponseFilterStatus } from "../list/page";

// کامپوننت فیلتر وضعیت پاسخ
const ResponseStatusFilter = ({ currentFilter }: { currentFilter?: ResponseFilterStatus }) => {
  const router = useRouter();
  const searchParamsHook = useSearchParams(); // استفاده از useSearchParams برای گرفتن پارامترهای فعلی

  const onFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParamsHook.toString()); // ایجاد پارامترهای جدید از روی پارامترهای فعلی
    if (value && value !== 'all') {
      params.set('responseStatus', value);
    } else {
      params.delete('responseStatus');
    }
    params.delete('page'); // بازگشت به صفحه اول با تغییر فیلتر
    router.push(`/checklists/list?${params.toString()}`);
  };

  return (
    <Select.Root defaultValue={currentFilter || 'all'} onValueChange={onFilterChange}>
      <Select.Trigger placeholder="فیلتر بر اساس وضعیت پاسخ..." />
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
    // usersForFilter?: { id: string; name: string | null; email: string | null }[]; // اگر لیست کاربران را پاس می‌دهید
}

const ChecklistListClientFilters = ({ searchParams }: ClientFiltersProps) => {
  const router = useRouter();
  const currentSearchParams = useSearchParams();

  const onUserFilterChange = (userIdToFilter: string) => {
    const params = new URLSearchParams(currentSearchParams.toString());
    if (userIdToFilter && userIdToFilter !== 'all') {
      params.set('assignedToUserId', userIdToFilter);
    } else {
      params.delete('assignedToUserId');
    }
    params.delete('page');
    router.push(`/checklists/list?${params.toString()}`);
  };
  
  return (
    <Flex gap="3" align="center" wrap="wrap" mt="3" mb="3">
      <ResponseStatusFilter currentFilter={searchParams.responseStatus} />
      <RadixButton 
        variant={searchParams.assignedToUserId === 'me' ? "solid" : "soft"}
        onClick={() => onUserFilterChange(searchParams.assignedToUserId === 'me' ? 'all' : 'me')}
      >
        <MixerHorizontalIcon />
        {searchParams.assignedToUserId === 'me' ? "نمایش همه کاربران" : "فقط اختصاص یافته به من"}
      </RadixButton>
      {/* // مثال برای Select کاربران اگر لیست کاربران را از سرور پاس داده بودید:
        // فرض کنید usersForFilter از props پاس داده شده است.
        {usersForFilter && usersForFilter.length > 0 && (
            <Select.Root 
                value={searchParams.assignedToUserId && searchParams.assignedToUserId !== 'me' ? searchParams.assignedToUserId : 'all'} 
                onValueChange={(value) => onUserFilterChange(value)}
            >
                <Select.Trigger placeholder="فیلتر بر اساس کاربر..." />
                <Select.Content>
                    <Select.Item value="all">همه کاربران (غیر از من)</Select.Item>
                    {usersForFilter.map(user => (
                        <Select.Item key={user.id} value={user.id}>{user.name || user.email}</Select.Item>
                    ))}
                </Select.Content>
            </Select.Root>
        )}
      */}
    </Flex>
  );
};

export default ChecklistListClientFilters;
