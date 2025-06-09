// File: app/workspaces/[workspaceId]/checklists/new/_components/NewChecklistFormClient.tsx
'use client';

import React, { useState, useEffect, useMemo } from "react";
import { Button, TextField, Card, Flex, IconButton, Text, Box, Callout, Checkbox, Heading, TextArea } from "@radix-ui/themes";
import dynamic from 'next/dynamic';
import { useForm, useFieldArray, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Cross2Icon, DragHandleDots2Icon, PlusIcon } from '@radix-ui/react-icons';
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import { Category, Tag } from "@prisma/client";

import { templateFormSchema } from '@/app/checklists/validationSchemas';
import { TemplateFormData, ApiErrorResponse } from '@/app/checklists/types';

const SimpleMDE = dynamic(() => import('react-simplemde-editor'), { ssr: false });
import "easymde/dist/easymde.min.css";

interface Props {
  workspaceId: number; // ✅ پراپ جدید
  categories: Pick<Category, 'id' | 'name'>[];
  tags: Pick<Tag, 'id' | 'name' | 'color'>[];
}

const NewChecklistFormClient: React.FC<Props> = ({ workspaceId, categories, tags }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => { setIsBrowser(true); }, []);

  const {
    register, control, handleSubmit,
    formState: { errors },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      title: "",
      description: "",
      items: [{ title: "", description: "", order: 0 }],
      categoryIds: [],
      tagIds: [],
    },
  });

  const { fields, append, remove, move } = useFieldArray({ control, name: "items" });
  const simpleMDEOptions = useMemo(() => ({ spellChecker: false, status: false }), []);

  const onSubmitHandler: SubmitHandler<TemplateFormData> = async (data) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const payload = {
        title: data.title,
        description: data.description || "",
        items: data.items.map((item, index) => ({ ...item, order: index })),
        categoryIds: (data.categoryIds || []).map(id => parseInt(id)),
        tagIds: (data.tagIds || []).map(id => parseInt(id)),
        workspaceId: workspaceId, // ✅ تغییر کلیدی: افزودن شناسه فضای کاری به داده‌های ارسالی
      };

      await axios.post("/api/checklist-templates", payload);
      alert("الگوی چک‌لیست با موفقیت ایجاد شد!");
      // بازگشت به لیست چک‌لیست‌های همان فضای کاری
      router.push(`/workspaces/${workspaceId}/checklists`);
      router.refresh();

    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      const errorMessage = axiosError.response?.data?.error || "خطایی در ایجاد الگو رخ داد.";
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const onDragEnd = (result: DropResult) => {
      if (!result.destination) return;
      move(result.source.index, result.destination.index);
  };
  
  const addNewItem = () => append({ title: "", description: "", order: fields.length });

  // JSX فرم بدون تغییر باقی می‌ماند و مشابه فرم قبلی شماست
  // ... (کد کامل JSX فرم را از فایل `app/checklists/new/_components/NewChecklistForm.tsx` کپی کنید)
  // تنها تفاوت در منطق `onSubmitHandler` است که در بالا پیاده‌سازی شد.

  return (
         <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6 dir-rtl">
           {submitError && (
             <Callout.Root color="red" mb="4" role="alert">
               <Callout.Text>{submitError}</Callout.Text>
             </Callout.Root>
           )}
     
           <Card variant="surface" className="p-4 md:p-6 shadow-sm rounded-lg">
             <Heading as="h2" size="5" mb="4">اطلاعات پایه الگو</Heading>
             <Flex direction="column" gap="4">
               <div>
                 <label htmlFor="templateTitle-input" className="block mb-1">
                   <Text size="2" weight="bold">نام الگو:</Text>
                 </label>
                 <TextField.Root>
                   <TextField.Input id="templateTitle-input" {...register("title")} size="3" placeholder="مثال: بررسی امنیتی قبل از انتشار" />
                 </TextField.Root>
                 {errors.title && <Text color="red" size="1" as="p" mt="1">{errors.title.message}</Text>}
               </div>
               <div>
                 <label htmlFor="templateDescription-mde" className="block mb-1">
                   <Text size="2" weight="bold">توضیحات (اختیاری):</Text>
                 </label>
                 <Controller name="description" control={control} render={({ field }) => (
                   <SimpleMDE id="templateDescription-mde" placeholder="جزئیات بیشتر..." value={field.value || ""} onChange={field.onChange} options={simpleMDEOptions} />
                 )} />
               </div>
             </Flex>
           </Card>
     
           {categories.length > 0 && (
             <Card variant="surface" className="p-4 md:p-6 shadow-sm">
               <Heading as="h3" size="4" mb="3">دسته‌بندی‌ها</Heading>
               <Flex wrap="wrap" gap="3">
                 {categories.map(category => (
                   <label key={category.id} className="flex items-center gap-2 p-2 border rounded-md cursor-pointer">
                     <input type="checkbox" value={category.id} {...register("categoryIds")} className="accent-green-500" />
                     <Text size="2">{category.name}</Text>
                   </label>
                 ))}
               </Flex>
             </Card>
           )}
     
           {tags.length > 0 && (
             <Card variant="surface" className="p-4 md:p-6 shadow-sm">
               <Heading as="h3" size="4" mb="3">برچسب‌ها</Heading>
               <Flex wrap="wrap" gap="3">
                 {tags.map(tag => (
                   <label key={tag.id} className="flex items-center gap-2 p-2 border rounded-md cursor-pointer">
                     <input type="checkbox" value={tag.id} {...register("tagIds")} className="accent-green-500" />
                     <Text size="2">{tag.name}</Text>
                   </label>
                 ))}
               </Flex>
             </Card>
           )}
     
           <Card variant="surface" className="p-4 md:p-6 shadow-sm">
             <Heading as="h2" size="5" mb="4">آیتم‌های چک‌لیست</Heading>
             {errors.items && <Text color="red" size="1" as="p" mb="2">{errors.items.message || "خطا در آیتم‌ها"}</Text>}
             {isBrowser && (
               <DragDropContext onDragEnd={onDragEnd}>
                 <Droppable droppableId="newChecklistItems">
                   {(provided) => (
                     <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                       {fields.map((item, index) => (
                         <Draggable key={item.id} draggableId={item.id} index={index}>
                           {(providedDraggable, snapshot) => (
                             <Card ref={providedDraggable.innerRef} {...providedDraggable.draggableProps} className={`p-3 transition-shadow ${snapshot.isDragging ? 'shadow-xl' : 'shadow-sm'}`}>
                               <Flex align="start" gap="2">
                                 <Box {...providedDraggable.dragHandleProps} className="pt-2 cursor-grab">
                                   <DragHandleDots2Icon />
                                 </Box>
                                 <Flex direction="column" grow="1" gap="2">
                                   <TextField.Input placeholder={`عنوان آیتم ${index + 1}`} {...register(`items.${index}.title`)} />
                                   <TextArea placeholder="توضیحات (اختیاری)" {...register(`items.${index}.description`)} className="min-h-[60px]" />
                                 </Flex>
                                 <IconButton variant="ghost" color="red" type="button" onClick={() => remove(index)}>
                                   <Cross2Icon />
                                 </IconButton>
                               </Flex>
                             </Card>
                           )}
                         </Draggable>
                       ))}
                       {provided.placeholder}
                     </div>
                   )}
                 </Droppable>
               </DragDropContext>
             )}
             <Button type="button" onClick={addNewItem} variant="soft" mt="4">
               <PlusIcon /> اضافه کردن آیتم
             </Button>
           </Card>
     
           <Flex justify="end" mt="6">
             <Button type="submit" size="3" disabled={isSubmitting} color="green" variant="solid">
               {isSubmitting ? "در حال ذخیره..." : "ذخیره الگو"}
             </Button>
           </Flex>
         </form>
  );
};

export default NewChecklistFormClient;