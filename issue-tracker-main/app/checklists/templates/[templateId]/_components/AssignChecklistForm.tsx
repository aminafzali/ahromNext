
// کامپوننت AssignChecklistForm باید در فایل app/checklists/templates/[templateId]/_components/AssignChecklistForm.tsx ایجاد شود.
// محتوای اولیه آن می‌تواند به شکل زیر باشد:


// app/checklists/templates/[templateId]/_components/AssignChecklistForm.tsx
"use client";

import { Button, Callout, Select, Text, TextField } from "@radix-ui/themes";
import React, { useState } from "react";
import { User } from "@prisma/client";
import axios from "axios";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const assignChecklistSchema = z.object({
  assignedToUserId: z.string().min(1, "انتخاب کاربر الزامی است."),
  dueDate: z.string().optional(), // می‌توانید تاریخ سررسید را هم اضافه کنید
});

type AssignChecklistFormData = z.infer<typeof assignChecklistSchema>;

interface Props {
  templateId: number;
  users: Pick<User, 'id' | 'name' | 'email'>[];
}

const AssignChecklistForm = ({ templateId, users }: Props) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AssignChecklistFormData>({
    resolver: zodResolver(assignChecklistSchema),
    defaultValues: { // اضافه کردن مقادیر پیش‌فرض
        assignedToUserId: "",
        dueDate: "",
    }
  });

  const onSubmit = async (data: AssignChecklistFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await axios.post("/api/checklist-assignments", {
        templateId: templateId,
        assignedToUserId: data.assignedToUserId,
        dueDate: data.dueDate || null, // ارسال null اگر تاریخ وارد نشده باشد
      });
      router.refresh(); 
      alert('چک‌لیست با موفقیت تخصیص داده شد!');
    } catch (err) {
      setIsSubmitting(false);
      setError("خطا در تخصیص چک‌لیست. لطفاً دوباره تلاش کنید.");
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Callout.Root color="red" className="mb-3">
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}
      <Controller
        name="assignedToUserId"
        control={control}
        render={({ field }) => (
          <Select.Root
            value={field.value}
            onValueChange={field.onChange}
          >
            <Select.Trigger placeholder="یک کاربر را انتخاب کنید..." />
            <Select.Content>
              <Select.Group>
                <Select.Label>کاربران</Select.Label>
                {users.map((user) => (
                  <Select.Item key={user.id} value={user.id}>
                    {user.name || user.email}
                  </Select.Item>
                ))}
              </Select.Group>
            </Select.Content>
          </Select.Root>
        )}
      />
      {errors.assignedToUserId && (
        <Text color="red" size="1">
          {errors.assignedToUserId.message}
        </Text>
      )}

      <div>
       
        <label htmlFor="dueDate" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
          <Text size="2">تاریخ سررسید (اختیاری)</Text>
        </label>
        <TextField.Input type="date" id="dueDate" {...register("dueDate")} />
        
      </div>
      

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "در حال تخصیص..." : "تخصیص چک‌لیست"}
      </Button>
    </form>
  );
};

export default AssignChecklistForm;