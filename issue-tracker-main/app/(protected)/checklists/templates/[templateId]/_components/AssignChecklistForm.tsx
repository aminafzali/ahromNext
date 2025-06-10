// File: app/checklists/templates/[templateId]/_components/AssignChecklistForm.tsx (نسخه نهایی)
"use client";

import {
  Button,
  Callout,
  Text,
  Box,
  Flex,
  DropdownMenu,
  Tooltip,
  IconButton,
} from "@radix-ui/themes";
import React, { useState, useEffect, useRef } from "react";
import { User, Team } from "@prisma/client";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import Spinner from "@/app/components/Spinner";
import { CalendarIcon, CrossCircledIcon } from "@radix-ui/react-icons";

import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import gregorian from "react-date-object/calendars/gregorian"; // برای تبدیل به میلادی
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian_en from "react-date-object/locales/gregorian_en"; // برای فرمت میلادی
import "react-multi-date-picker/styles/layouts/mobile.css";
import "./customDatePickerStyles.css";

// Schema برای اعتبارسنجی تاریخ میلادی به صورت رشته "YYYY-MM-DD" (اختیاری)
const optionalGregorianDateStringSchema = z
  .string()
  .optional()
  .nullable()
  .refine(
    (val) => {
      if (!val || val === "") return true;
      const regex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
      if (!regex.test(val)) return false;
      const date = new Date(val); // این رشته میلادی را مستقیماً به Date تبدیل می‌کند
      return !isNaN(date.getTime()) && date.toISOString().startsWith(val);
    },
    { message: "فرمت تاریخ ارسالی باید YYYY-MM-DD میلادی باشد." }
  );

// Schema برای اعتبارسنجی فرم
const assignChecklistSchema = z
  .object({
    assignedUserIds: z.array(z.string()).optional(),
    assignedTeamIds: z.array(z.number()).optional(),
    dueDate: z.string().optional().nullable(),
  })
  .refine(
    (data) => data.assignedUserIds?.length || data.assignedTeamIds?.length,
    {
      message: "حداقل یک کاربر یا تیم باید انتخاب شود.",
    }
  );

type AssignChecklistFormData = z.infer<typeof assignChecklistSchema>;

interface Props {
  templateId: number;
  workspaceUsers: User[]; // لیست تمام کاربران فضای کاری
  workspaceTeams: Team[]; // لیست تمام تیم‌های فضای کاری
}

const AssignChecklistForm = ({
  templateId,
  workspaceUsers,
  workspaceTeams,
}: Props) => {
  const router = useRouter();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const datePickerRef = useRef<any>(null);
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AssignChecklistFormData>({
    resolver: zodResolver(assignChecklistSchema),
    defaultValues: { assignedUserIds: [], assignedTeamIds: [], dueDate: null },
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State محلی برای مدیریت انتخاب‌ها در UI
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);

  const currentDueDate = watch("dueDate"); // این مقدار اکنون رشته میلادی "YYYY-MM-DD" یا خالی خواهد بود

  const onSubmit: SubmitHandler<AssignChecklistFormData> = async (data) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await axios.post("/api/checklist-assignments", {
        templateId,
        assignedUserIds: selectedUsers,
        assignedTeamIds: selectedTeams,
        dueDate: data.dueDate,
      });
      alert("چک‌لیست با موفقیت تخصیص داده شد!");
      // TODO: setValue برای اختصاص کاربر و تیم چرا نیست؟ شاید نیاز به اصلاح داشته باشد
      setValue("dueDate", "");
      setIsCalendarOpen(false);
      router.refresh();
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string; details?: any }>;
      setError(axiosError.response?.data?.error || "خطا در تخصیص چک‌لیست.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // از اینجا به بعد توابع مربوط به تقویم آورده میشود

  const handleDateChange = (dateSelected: DateObject | DateObject[] | null) => {
    const singleDateSelected = Array.isArray(dateSelected)
      ? dateSelected[0]
      : dateSelected;

    if (singleDateSelected) {
      // dateSelected یک DateObject با تقویم فارسی است.
      // آن را به میلادی تبدیل کرده و به فرمت "YYYY-MM-DD" در می‌آوریم.
      const gregorianDate = new DateObject(singleDateSelected).convert(
        gregorian,
        gregorian_en
      );
      setValue("dueDate", gregorianDate.format("YYYY-MM-DD"));
    } else {
      setValue("dueDate", "");
    }
    setIsCalendarOpen(false);
  };

  const toggleCalendar = () => {
    if (isCalendarOpen && datePickerRef.current) {
      datePickerRef.current.closeCalendar();
    } else if (!isCalendarOpen && datePickerRef.current) {
      datePickerRef.current.openCalendar();
    }
    setIsCalendarOpen(!isCalendarOpen);
  };

  const clearDate = () => {
    setValue("dueDate", "");
    if (datePickerRef.current) {
      datePickerRef.current.closeCalendar();
    }
    setIsCalendarOpen(false);
  };

  // تبدیل currentDueDate (که رشته میلادی است) به DateObject شمسی برای نمایش
  let displayPersianDate: DateObject | null = null;
  if (currentDueDate) {
    try {
      // ابتدا از رشته میلادی YYYY-MM-DD یک DateObject میلادی بساز
      const gregorianObj = new DateObject({
        date: currentDueDate,
        calendar: gregorian,
        locale: gregorian_en,
        format: "YYYY-MM-DD",
      });
      if (gregorianObj.isValid) {
        // سپس آن را به شمسی تبدیل کن
        displayPersianDate = gregorianObj.convert(persian, persian_fa);
      }
    } catch (e) {
      console.error(
        "Error converting Gregorian string to Persian DateObject for display:",
        e
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 dir-rtl">
      {error && (
        <Callout.Root color="red" role="alert">
          <Text>{error}</Text>
        </Callout.Root>
      )}

      <Box>
        <Text as="div" size="2" weight="bold" mb="1">
          تخصیص به:
        </Text>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Button
              type="button"
              variant="soft"
              color="gray"
              className="w-full justify-between"
            >
              <Text>
                {selectedUsers.length} کاربر و {selectedTeams.length} تیم انتخاب
                شده
              </Text>
              <ChevronDownIcon />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            <DropdownMenu.Label>تیم‌ها</DropdownMenu.Label>
            {workspaceTeams.map((team) => (
              <DropdownMenu.CheckboxItem
                key={`team-${team.id}`}
                checked={selectedTeams.includes(team.id)}
                onCheckedChange={(checked) =>
                  setSelectedTeams((c) =>
                    checked ? [...c, team.id] : c.filter((id) => id !== team.id)
                  )
                }
              >
                {team.name}
              </DropdownMenu.CheckboxItem>
            ))}
            <DropdownMenu.Separator />
            <DropdownMenu.Label>کاربران</DropdownMenu.Label>
            {workspaceUsers.map((user) => (
              <DropdownMenu.CheckboxItem
                key={`user-${user.id}`}
                checked={selectedUsers.includes(user.id)}
                onCheckedChange={(checked) =>
                  setSelectedUsers((c) =>
                    checked ? [...c, user.id] : c.filter((id) => id !== user.id)
                  )
                }
              >
                {user.name || user.email}
              </DropdownMenu.CheckboxItem>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
        {errors.assignedUserIds && (
          <Text color="red" size="1" as="p">
            {errors.assignedUserIds.message}
          </Text>
        )}
      </Box>

      {/* بخش انتخاب تاریخ (DatePicker) بدون تغییر باقی می‌ماند */}
      <Box>
        <Text
          size="2"
          weight="bold"
          className="text-gray-700 dark:text-gray-300 mb-1 block"
        >
          تاریخ سررسید (اختیاری):
        </Text>
        <Flex align="center" gap="3" className="relative">
          <Button
            type="button"
            variant="outline"
            color="gray"
            onClick={toggleCalendar}
            className="shrink-0 px-3 py-1.5 rounded-md border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <CalendarIcon />
            <Text size="2">
              {currentDueDate ? "ویرایش تاریخ" : "انتخاب تاریخ"}
            </Text>
          </Button>

          {currentDueDate &&
          displayPersianDate &&
          displayPersianDate.isValid ? (
            <Flex
              align="center"
              gap="2"
              className="border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded-md bg-gray-50 dark:bg-gray-700/30 grow items-center"
            >
              <Text size="2" className="text-gray-800 dark:text-gray-100">
                {displayPersianDate.format("DD MMMM YYYY")}
              </Text>
              <Tooltip content="پاک کردن تاریخ">
                <IconButton
                  size="1"
                  variant="ghost"
                  color="gray"
                  onClick={clearDate}
                  type="button"
                  className="mr-auto !cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full p-1"
                >
                  <CrossCircledIcon width="14" height="14" />
                </IconButton>
              </Tooltip>
            </Flex>
          ) : (
            <Box className="grow"></Box>
          )}

          <Box
            style={{
              display: isCalendarOpen ? "block" : "none",
              position: "absolute",
              top: "calc(100% + 4px)",
              right: 0,
              zIndex: 110,
            }}
          >
            <Controller
              name="dueDate" // این فیلد اکنون رشته میلادی YYYY-MM-DD را نگه می‌دارد
              control={control}
              render={({ field }) => (
                <DatePicker
                  ref={datePickerRef}
                  // مقدار DatePicker باید یک DateObject شمسی باشد یا null
                  value={
                    field.value
                      ? new DateObject({
                          date: field.value,
                          calendar: gregorian,
                          locale: gregorian_en,
                        }).convert(persian, persian_fa)
                      : null
                  }
                  onChange={handleDateChange} // handleDateChange مقدار را به میلادی "YYYY-MM-DD" تبدیل و در فرم ذخیره می‌کند
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-right"
                />
              )}
            />
          </Box>
        </Flex>
        {errors.dueDate && (
          <Text color="red" size="1" as="p" mt="1" className="text-right">
            {errors.dueDate.message}
          </Text>
        )}
      </Box>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting && <Spinner />} تخصیص چک‌لیست
      </Button>
    </form>
  );
};

export default AssignChecklistForm;
