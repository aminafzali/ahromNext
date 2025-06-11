// File: app/(protected)/workspaces/new/_components/NewWorkspaceForm.tsx
'use client';

import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TextField, Button, Callout, Text, Flex, Card, TextArea } from '@radix-ui/themes';
import axios, { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Spinner from '@/app/components/Spinner';

// Schema برای اعتبارسنجی فرم
const workspaceSchema = z.object({
  name: z.string().min(3, 'نام فضای کاری باید حداقل ۳ کاراکتر باشد.').max(100),
  description: z.string().max(255, 'توضیحات نمی‌تواند بیشتر از ۲۵۵ کاراکتر باشد.').optional(),
});

type WorkspaceFormData = z.infer<typeof workspaceSchema>;

const NewWorkspaceForm = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
  });

  const createWorkspaceMutation = useMutation({
    mutationFn: (data: WorkspaceFormData) => axios.post('/api/workspaces', data),
    onSuccess: () => {
      // پس از موفقیت، کوئری مربوط به لیست ورک‌اسپیس‌ها را دوباره فراخوانی می‌کنیم
      // تا لیست در سایدبار و داشبورد به‌روز شود.
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      alert('فضای کاری با موفقیت ایجاد شد.');
      router.push('/dashboard'); // کاربر را به داشبورد هدایت می‌کنیم
      router.refresh(); // برای اطمینان از رفرش شدن کامل صفحه
    },
    onError: (error) => {
      // مدیریت خطا در اینجا انجام می‌شود
      const axiosError = error as AxiosError<{ error?: string }>;
      alert(axiosError.response?.data?.error || 'خطایی در ایجاد فضای کاری رخ داد.');
    }
  });

  const onSubmit: SubmitHandler<WorkspaceFormData> = (data) => {
    createWorkspaceMutation.mutate(data);
  };

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
        {createWorkspaceMutation.isError && (
          <Callout.Root color="red">
            <Callout.Text>خطایی رخ داد. لطفاً دوباره تلاش کنید.</Callout.Text>
          </Callout.Root>
        )}
        
        <label>
          <Text as="div" size="2" weight="bold" mb="1">نام فضای کاری</Text>
          <TextField.Input {...register('name')} placeholder="مثال: تیم محصول" />
          {errors.name && <Text color="red" size="1">{errors.name.message}</Text>}
        </label>

        <label>
          <Text as="div" size="2" weight="bold" mb="1">توضیحات (اختیاری)</Text>
          <TextArea {...register('description')} placeholder="یک توضیح کوتاه در مورد این فضای کاری" />
          {errors.description && <Text color="red" size="1">{errors.description.message}</Text>}
        </label>

        <Flex justify="end">
          <Button disabled={createWorkspaceMutation.isPending}>
            {createWorkspaceMutation.isPending && <Spinner />}
            ایجاد فضای کاری
          </Button>
        </Flex>
      </form>
    </Card>
  );
};

export default NewWorkspaceForm;