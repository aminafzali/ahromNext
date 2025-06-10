// app/checklists/assignments/[assignmentId]/respond/_components/ChecklistRespondForm.tsx
"use client";

import { Button, Callout, Card, Flex, Heading, Text, TextArea, TextField, RadioGroup, Separator, Box } from "@radix-ui/themes";
import React, { useState } from "react";
import { ResponseStatus as PrismaResponseStatus, User, Issue, ChecklistTemplate, ChecklistItem } from "@prisma/client";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm, Controller, useFieldArray, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { ChecklistItemWithResponse } from "../page"; 

// Schema برای یک پاسخ آیتم
const itemResponseSchema = z.object({
  itemId: z.number(),
  responseId: z.number(),
  status: z.nativeEnum(PrismaResponseStatus),
  issueTitle: z.string().optional(),
  issueDescription: z.string().optional(),
});

// Schema برای کل فرم پاسخ‌ها
const respondFormSchema = z.object({
  responses: z.array(itemResponseSchema),
});

type RespondFormData = z.infer<typeof respondFormSchema>;

interface Props {
  assignmentId: number;
  template: Omit<ChecklistTemplate, 'items' | 'createdAt' | 'updatedAt' | 'assignments'> & { 
    items: ChecklistItemWithResponse[] 
  };
  currentUserId: string;
}

const ChecklistRespondForm = ({ assignmentId, template, currentUserId }: Props) => {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIssueFormForItem, setShowIssueFormForItem] = useState<number | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    register,
    formState: { errors },
  } = useForm<RespondFormData>({
    resolver: zodResolver(respondFormSchema),
    defaultValues: {
      responses: template.items.map(item => ({
        itemId: item.id,
        responseId: item.responses[0]?.id || -1,
        status: item.responses[0]?.status || PrismaResponseStatus.NONE,
        issueTitle: "",
        issueDescription: "",
      })),
    },
  });

  const { fields } = useFieldArray({
    control,
    name: "responses",
  });

  const onSubmit: SubmitHandler<RespondFormData> = async (data) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      await axios.patch(`/api/checklist-assignments/${assignmentId}/responses`, {
        responses: data.responses.map(r => ({ responseId: r.responseId, status: r.status, itemId: r.itemId })),
      });

      for (const response of data.responses) {
        if (response.status === PrismaResponseStatus.UNACCEPTABLE && response.issueTitle && response.issueTitle.trim() !== "") {
          try {
            const checklistItemTitle = template.items.find(i => i.id === response.itemId)?.title || "نامشخص";
            const issueDescriptionDefault = `مسئله مربوط به آیتم چک‌لیست: "${checklistItemTitle}" از الگوی "${template.title}" (تخصیص شماره ${assignmentId})`;
            
            await axios.post("/api/issues", {
              title: response.issueTitle,
              description: response.issueDescription || issueDescriptionDefault,
              status: 'OPEN',
              checklistResponseId: response.responseId > 0 ? response.responseId : undefined,
            });
          } catch (issueError) {
            console.error(`خطا در ایجاد Issue برای آیتم ${response.itemId}:`, issueError);
          }
        }
      }
      alert("پاسخ‌ها با موفقیت ثبت شدند.");
      router.push("/checklists/list");
      router.refresh();
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>;
      setFormError(axiosError.response?.data?.error || "خطا در ثبت پاسخ‌ها. لطفاً دوباره تلاش کنید.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = (index: number, value: string) => {
    const newStatus = value as PrismaResponseStatus;
    setValue(`responses.${index}.status`, newStatus);
    if (newStatus !== PrismaResponseStatus.UNACCEPTABLE) {
      if (showIssueFormForItem === fields[index].itemId) {
        setShowIssueFormForItem(null);
      }
      setValue(`responses.${index}.issueTitle`, "");
      setValue(`responses.${index}.issueDescription`, "");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {formError && (
        <Callout.Root color="red" className="mb-4">
          <Callout.Text>{formError}</Callout.Text>
        </Callout.Root>
      )}

      {fields.map((field, index) => {
        const currentItem = template.items[index];
        const currentResponseValue = watch(`responses.${index}.status`);
        const existingIssues = currentItem.responses[0]?.issues || [];
        const radioGroupName = `status-${field.id}`;

        return (
          <Card key={field.id} variant="surface">
            <Flex direction="column" gap="3">
              <Heading as="h3" size="4">
                {index + 1}. {currentItem.title}
              </Heading>
              {currentItem.description && (
                <Text as="p" size="2" color="gray">
                  {currentItem.description}
                </Text>
              )}

              <Controller
                name={`responses.${index}.status`}
                control={control}
                render={({ field: controllerField }) => (
                  <RadioGroup.Root
                    name={radioGroupName}
                    value={controllerField.value}
                    onValueChange={(value) => handleStatusChange(index, value)}
                  >
                    <Flex gap="3" align="center" wrap="wrap">
                      {/* اصلاح: استفاده از label به عنوان flex container */}
                      <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <RadioGroup.Item value={PrismaResponseStatus.ACCEPTABLE} />
                        <Text size="2">قابل قبول</Text>
                      </label>
                      <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <RadioGroup.Item value={PrismaResponseStatus.UNACCEPTABLE} />
                        <Text size="2">غیر قابل قبول</Text>
                      </label>
                      <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <RadioGroup.Item value={PrismaResponseStatus.NONE} />
                        <Text size="2">بدون نظر</Text>
                      </label>
                    </Flex>
                  </RadioGroup.Root>
                )}
              />
              {errors.responses?.[index]?.status && (
                <Text color="red" size="1">{errors.responses[index]?.status?.message}</Text>
              )}

              {existingIssues.length > 0 && (
                <Box mt="2">
                  <Text size="2" weight="bold">مسائل مرتبط:</Text>
                  <Flex direction="column" gap="1" mt="1">
                    {existingIssues.map(issue => (
                        <Link key={issue.id} href={`/issues/${issue.id}`} passHref>
                             <Text size="2" color="blue" className="hover:underline">
                                {issue.title} (وضعیت: {issue.status})
                             </Text>
                        </Link>
                    ))}
                  </Flex>
                </Box>
              )}

              {currentResponseValue === PrismaResponseStatus.UNACCEPTABLE && existingIssues.length === 0 && (
                <Flex direction="column" gap="2" mt="2" p="3" style={{ backgroundColor: 'var(--red-2)', borderRadius: 'var(--radius-3)'}}>
                  {showIssueFormForItem === currentItem.id ? (
                    <>
                      <Text weight="bold" color="red">ایجاد مسئله جدید:</Text>
                      <TextField.Input 
                        placeholder="عنوان مسئله (الزامی برای ایجاد مسئله)" 
                        {...register(`responses.${index}.issueTitle`)} 
                      />
                      {errors.responses?.[index]?.issueTitle && (
                         <Text color="red" size="1">{errors.responses[index]?.issueTitle?.message}</Text>
                      )}
                      <TextArea 
                        placeholder="توضیحات مسئله (اختیاری)" 
                        {...register(`responses.${index}.issueDescription`)}
                      />
                       <Button type="button" variant="soft" color="gray" onClick={() => setShowIssueFormForItem(null)} size="1" style={{alignSelf: 'flex-start'}}>لغو</Button>
                    </>
                  ) : (
                    <Button type="button" variant="outline" color="red" onClick={() => setShowIssueFormForItem(currentItem.id)} size="2">
                      ایجاد مسئله برای این آیتم
                    </Button>
                  )}
                </Flex>
              )}
            </Flex>
          </Card>
        );
      })}

      <Separator my="4" size="4" />
      <Flex justify="end" gap="3">
        <Button variant="soft" color="gray" asChild type="button">
            <Link href="/checklists/list">انصراف</Link>
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "در حال ثبت پاسخ‌ها..." : "ثبت پاسخ‌ها"}
        </Button>
      </Flex>
    </form>
  );
};

export default ChecklistRespondForm;
