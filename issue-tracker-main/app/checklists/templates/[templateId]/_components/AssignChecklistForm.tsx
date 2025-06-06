// app/checklists/templates/[templateId]/_components/AssignChecklistForm.tsx
"use client";

import { Button, Callout, Select, Text, Box, Flex, IconButton, Tooltip } from "@radix-ui/themes";
import React, { useState, useRef } from "react"; // useEffect حذف شد چون فعلا استفاده نمی‌شود
import { User } from "@prisma/client";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, CrossCircledIcon } from '@radix-ui/react-icons';

import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import gregorian from "react-date-object/calendars/gregorian"; // برای تبدیل به میلادی
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian_en from "react-date-object/locales/gregorian_en"; // برای فرمت میلادی
import "react-multi-date-picker/styles/layouts/mobile.css"; 
import "./customDatePickerStyles.css"; 

// Schema برای اعتبارسنجی تاریخ میلادی به صورت رشته "YYYY-MM-DD" (اختیاری)
const optionalGregorianDateStringSchema = z.string().optional().nullable().refine(val => {
    if (!val || val === "") return true; 
    const regex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
    if (!regex.test(val)) return false;
    const date = new Date(val); // این رشته میلادی را مستقیماً به Date تبدیل می‌کند
    return !isNaN(date.getTime()) && date.toISOString().startsWith(val);
}, { message: "فرمت تاریخ ارسالی باید YYYY-MM-DD میلادی باشد." });


const assignChecklistSchema = z.object({
  assignedToUserId: z.string().min(1, "انتخاب کاربر الزامی است."),
  dueDate: optionalGregorianDateStringSchema, // اعتبارسنجی تاریخ میلادی رشته‌ای
});

type AssignChecklistFormData = z.infer<typeof assignChecklistSchema>;

interface Props {
  templateId: number;
  users: Pick<User, 'id' | 'name' | 'email'>[];
}

interface ApiErrorResponse {
  error: string;
  details?: any;
}

const AssignChecklistForm = ({ templateId, users }: Props) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const datePickerRef = useRef<any>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<AssignChecklistFormData>({
    resolver: zodResolver(assignChecklistSchema),
    defaultValues: {
        assignedToUserId: "",
        dueDate: "", 
    }
  });

  const currentDueDate = watch("dueDate"); // این مقدار اکنون رشته میلادی "YYYY-MM-DD" یا خالی خواهد بود

  const onSubmit: SubmitHandler<AssignChecklistFormData> = async (data) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // data.dueDate اکنون رشته میلادی "YYYY-MM-DD" یا null/undefined/"" است
      // API Route انتظار دارد که این رشته را دریافت کرده و به Date تبدیل کند.
      await axios.post("/api/checklist-assignments", {
        templateId: templateId,
        assignedToUserId: data.assignedToUserId,
        dueDate: data.dueDate || null, // ارسال رشته میلادی یا null
      });
      setValue("assignedToUserId", "");
      setValue("dueDate", "");
      setIsCalendarOpen(false);
      router.refresh(); 
      alert('چک‌لیست با موفقیت تخصیص داده شد!');
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(axiosError.response?.data?.error || "خطا در تخصیص چک‌لیست. لطفاً دوباره تلاش کنید.");
      console.error("Assign checklist error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = (dateSelected: DateObject | DateObject[] | null) => {
    const singleDateSelected = Array.isArray(dateSelected) ? dateSelected[0] : dateSelected;
    
    if (singleDateSelected) {
      // dateSelected یک DateObject با تقویم فارسی است.
      // آن را به میلادی تبدیل کرده و به فرمت "YYYY-MM-DD" در می‌آوریم.
      const gregorianDate = new DateObject(singleDateSelected).convert(gregorian, gregorian_en);
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
      const gregorianObj = new DateObject({ date: currentDueDate, calendar: gregorian, locale: gregorian_en, format: "YYYY-MM-DD" });
      if (gregorianObj.isValid) {
        // سپس آن را به شمسی تبدیل کن
        displayPersianDate = gregorianObj.convert(persian, persian_fa);
      }
    } catch (e) {
      console.error("Error converting Gregorian string to Persian DateObject for display:", e);
    }
  }


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 dir-rtl">
      {error && (
        <Callout.Root color="red" className="mb-3" role="alert">
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}
      
      <Box>
        <label htmlFor={`assign-user-${templateId}-select`} className="block mb-1">
            <Text size="2" weight="bold" className="text-gray-700 dark:text-gray-300">انتخاب کاربر:</Text>
        </label>
        <Controller
          name="assignedToUserId"
          control={control}
          render={({ field }) => (
            <Select.Root
              value={field.value || ""}
              onValueChange={field.onChange}
              dir="rtl"
            >
              <Select.Trigger 
                id={`assign-user-${templateId}-select`}
                placeholder="یک کاربر را انتخاب کنید..." 
                className="w-full dark:bg-gray-700 dark:text-white dark:border-gray-600 text-right" 
              />
              <Select.Content className="dark:bg-gray-800">
                <Select.Group>
                  <Select.Label className="dark:text-gray-400 text-right">کاربران</Select.Label>
                  {users.map((user) => (
                    <Select.Item key={user.id} value={user.id} className="hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 text-right">
                      {user.name || user.email}
                    </Select.Item>
                  ))}
                </Select.Group>
              </Select.Content>
            </Select.Root>
          )}
        />
        {errors.assignedToUserId && (
          <Text color="red" size="1" as="p" mt="1" className="text-right">
            {errors.assignedToUserId.message}
          </Text>
        )}
      </Box>

      <Box>
        <Text size="2" weight="bold" className="text-gray-700 dark:text-gray-300 mb-1 block">تاریخ سررسید (اختیاری):</Text>
        <Flex align="center" gap="3" className="relative">
          <Button type="button" variant="outline" color="gray" onClick={toggleCalendar} className="shrink-0 px-3 py-1.5 rounded-md border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <CalendarIcon />
            <Text size="2">{currentDueDate ? "ویرایش تاریخ" : "انتخاب تاریخ"}</Text>
          </Button>
          
          {currentDueDate && displayPersianDate && displayPersianDate.isValid ? (
            <Flex align="center" gap="2" className="border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded-md bg-gray-50 dark:bg-gray-700/30 grow items-center">
              <Text size="2" className="text-gray-800 dark:text-gray-100">
                {displayPersianDate.format("DD MMMM YYYY")}
              </Text>
              <Tooltip content="پاک کردن تاریخ">
                <IconButton size="1" variant="ghost" color="gray" onClick={clearDate} type="button" className="mr-auto !cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full p-1">
                  <CrossCircledIcon width="14" height="14" />
                </IconButton>
              </Tooltip>
            </Flex>
          ) : <Box className="grow"></Box>}
          
          <Box style={{ display: isCalendarOpen ? 'block' : 'none', position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 110 }}>
            <Controller
                name="dueDate" // این فیلد اکنون رشته میلادی YYYY-MM-DD را نگه می‌دارد
                control={control}
                render={({ field }) => ( 
                    <DatePicker
                        ref={datePickerRef}
                        // مقدار DatePicker باید یک DateObject شمسی باشد یا null
                        value={field.value ? new DateObject({ date: field.value, calendar: gregorian, locale: gregorian_en }).convert(persian, persian_fa) : null}
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

      <Button type="submit" disabled={isSubmitting} className="w-full mt-4" variant="solid" color="blue" size="3">
        {isSubmitting ? "در حال تخصیص..." : "تخصیص چک‌لیست"}
      </Button>
    </form>
  );
};

export default AssignChecklistForm;
