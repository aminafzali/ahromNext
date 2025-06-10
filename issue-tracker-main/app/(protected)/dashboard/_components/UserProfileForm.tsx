// File: app/dashboard/_components/UserProfileForm.tsx
'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TextField, Button, Callout, Text, Flex, Card, Heading } from '@radix-ui/themes';
import axios, { AxiosError } from 'axios';
import Spinner from '@/app/components/Spinner';

const profileSchema = z.object({
  firstName: z.string().min(2, 'نام الزامی است.'),
  lastName: z.string().min(2, 'نام خانوادگی الزامی است.'),
  username: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const UserProfileForm = () => {
  const { data: session, update: updateSession } = useSession();
  const user = session?.user;

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      username: user?.username || '',
    }
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  const onSubmit: SubmitHandler<ProfileFormData> = async (data) => {
    setSubmitting(true);
    setError(null);
    setSuccess('');
    try {
      await axios.patch('/api/users/profile', data);
      setSuccess('پروفایل شما با موفقیت به‌روز شد.');
      // به‌روزرسانی session برای نمایش فوری تغییرات در UI
      await updateSession({
          ...session,
          user: {
              ...session?.user,
              ...data
          }
      });
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      setError(axiosError.response?.data?.error || 'خطایی رخ داد.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <Heading as="h3" size="4" mb="5">اطلاعات پروفایل</Heading>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && <Callout.Root color="red">{error}</Callout.Root>}
        {success && <Callout.Root color="green">{success}</Callout.Root>}
        <Flex direction="column" gap="3">
          <label>
            <Text as="div" size="2" weight="bold">نام کاربری (انگلیسی):</Text>
            <TextField.Input {...register('username')} placeholder="my_username" />
            {errors.username && <Text color="red" size="1">{errors.username.message}</Text>}
          </label>
          <Flex gap="3">
            <label className="flex-1">
              <Text as="div" size="2" weight="bold">نام:</Text>
              <TextField.Input {...register('firstName')} placeholder="علی" />
              {errors.firstName && <Text color="red" size="1">{errors.firstName.message}</Text>}
            </label>
            <label className="flex-1">
              <Text as="div" size="2" weight="bold">نام خانوادگی:</Text>
              <TextField.Input {...register('lastName')} placeholder="محمدی" />
              {errors.lastName && <Text color="red" size="1">{errors.lastName.message}</Text>}
            </label>
          </Flex>
        </Flex>
        <Button mt="4" disabled={isSubmitting}>
          {isSubmitting && <Spinner />} ذخیره تغییرات
        </Button>
      </form>
    </Card>
  );
};

export default UserProfileForm;