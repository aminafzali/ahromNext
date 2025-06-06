// app/checklists/new/_components/NewChecklistForm.tsx
"use client";

import { Button, TextField, Card, Flex, IconButton, Text, Box, Callout, Checkbox, Separator, Heading } from "@radix-ui/themes";
import React, { useState, useEffect, useMemo } from "react";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import { useForm, useFieldArray, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Cross2Icon, DragHandleDots2Icon, PlusIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import { Category, Tag } from "@prisma/client";

const checklistItemClientSchema = z.object({
  title: z.string().min(1, "عنوان آیتم الزامی است.").max(255),
  description: z.string().max(65535).optional(),
});

const checklistTemplateClientSchema = z.object({
  templateTitle: z.string().min(1, "نام الگو الزامی است.").max(255),
  templateDescription: z.string().max(65535).optional(),
  items: z.array(checklistItemClientSchema).min(1, "حداقل یک آیتم برای الگو الزامی است."),
  categoryIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
});

export type ChecklistTemplateFormData = z.infer<typeof checklistTemplateClientSchema>;

interface ApiErrorResponse {
  error: string;
  details?: any;
}

interface NewChecklistFormProps {
  categories: Pick<Category, 'id' | 'name'>[];
  tags: Pick<Tag, 'id' | 'name'>[];
}

const NewChecklistForm: React.FC<NewChecklistFormProps> = ({ categories, tags }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isBrowser, setIsBrowser] = useState<boolean>(false);

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ChecklistTemplateFormData>({
    resolver: zodResolver(checklistTemplateClientSchema),
    defaultValues: {
      templateTitle: "",
      templateDescription: "",
      items: [{ title: "", description: "" }],
      categoryIds: [],
      tagIds: [],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "items",
  });

  const simpleMDEOptions = useMemo(() => ({
    spellChecker: false, status: false, autosave: { enabled: false, uniqueId: "new_template_description_v2" }
  }), []);

  const minItemsLength = checklistTemplateClientSchema.shape.items._def.minLength?.value ?? 0;

  const onSubmitHandler: SubmitHandler<ChecklistTemplateFormData> = async (data) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const itemsWithOrder = data.items.map((item, index) => ({
        ...item,
        description: item.description || "",
        order: index,
      }));

      const payload = {
        templateTitle: data.templateTitle,
        templateDescription: data.templateDescription || "",
        items: itemsWithOrder,
        categoryIds: data.categoryIds?.map(id => parseInt(id, 10)).filter(id => !isNaN(id)) || [],
        tagIds: data.tagIds?.map(id => parseInt(id, 10)).filter(id => !isNaN(id)) || [],
      };

      await axios.post("/api/checklist-templates", payload);
      alert("الگوی چک‌لیست با موفقیت ایجاد شد!");
      router.push("/checklists/list?tab=templates");
      router.refresh();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setSubmitError(axiosError.response?.data?.error || "خطایی در ایجاد الگو رخ داد.");
      console.error("Submit error details:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    move(result.source.index, result.destination.index);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6">
      {submitError && (
        <Callout.Root color="red" mb="4" role="alert"><Callout.Text>{submitError}</Callout.Text></Callout.Root>
      )}

      <Card variant="surface" className="p-4 md:p-6 shadow-sm dark:bg-gray-800 rounded-lg">
        <Heading as="h2" size="5" mb="4" className="text-gray-700 dark:text-gray-200">اطلاعات پایه الگو</Heading>
        <Flex direction="column" gap="4">
            <div>
                <label htmlFor="templateTitle-input" className="block mb-1">
                    <Text size="2" weight="bold" className="text-gray-700 dark:text-gray-300">نام الگو:</Text>
                </label>
                <TextField.Root>
                    <TextField.Input id="templateTitle-input" placeholder="مثال: بررسی امنیتی قبل از انتشار" {...register("templateTitle")} size="3" className="dark:bg-gray-700 dark:text-white dark:border-gray-600"/>
                </TextField.Root>
                {errors.templateTitle && <Text color="red" size="1" as="p" mt="1">{errors.templateTitle.message}</Text>}
            </div>
            <div>
                <label htmlFor="templateDescription-mde" className="block mb-1">
                    <Text size="2" weight="bold" className="text-gray-700 dark:text-gray-300">توضیحات الگو (اختیاری):</Text>
                </label>
                <Controller
                    name="templateDescription"
                    control={control}
                    render={({ field }) => <SimpleMDE id="templateDescription-mde" placeholder="جزئیات بیشتر..." value={field.value || ""} onChange={field.onChange} options={simpleMDEOptions} />}
                />
                {errors.templateDescription && <Text color="red" size="1" as="p" mt="1">{errors.templateDescription.message}</Text>}
            </div>
        </Flex>
      </Card>
      
      {categories.length > 0 && (
        <Card variant="surface" className="p-4 md:p-6 shadow-sm dark:bg-gray-800 rounded-lg">
            <Heading as="h3" size="4" mb="3" className="text-gray-700 dark:text-gray-200">دسته‌بندی‌ها (اختیاری)</Heading>
            <Flex wrap="wrap" gap="3">
                {categories.map(category => (
                    // اصلاح: استفاده از label و Flex برای هر Checkbox
                    <label key={category.id} className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                        <Checkbox value={String(category.id)} {...register("categoryIds")} id={`category-${category.id}`} />
                        <Text size="2" className="text-gray-700 dark:text-gray-200">{category.name}</Text>
                    </label>
                ))}
            </Flex>
            {errors.categoryIds && <Text color="red" size="1" as="p" mt="1">{errors.categoryIds.message}</Text>}
        </Card>
      )}

      {tags.length > 0 && (
        <Card variant="surface" className="p-4 md:p-6 shadow-sm dark:bg-gray-800 rounded-lg">
            <Heading as="h3" size="4" mb="3" className="text-gray-700 dark:text-gray-200">برچسب‌ها (اختیاری)</Heading>
            <Flex wrap="wrap" gap="3">
                {tags.map(tag => (
                    // اصلاح: استفاده از label و Flex برای هر Checkbox
                    <label key={tag.id} className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                        <Checkbox value={String(tag.id)} {...register("tagIds")} id={`tag-${tag.id}`} />
                        <Text size="2" className="text-gray-700 dark:text-gray-200">{tag.name}</Text>
                    </label>
                ))}
            </Flex>
            {errors.tagIds && <Text color="red" size="1" as="p" mt="1">{errors.tagIds.message}</Text>}
        </Card>
      )}


      <Card variant="surface" className="p-4 md:p-6 shadow-sm dark:bg-gray-800 rounded-lg">
        <Heading as="h2" size="5" mb="4" className="text-gray-700 dark:text-gray-200">آیتم‌های چک‌لیست</Heading>
        {errors.items?.root && <Text color="red" size="1" as="p" mb="2">{errors.items.root.message}</Text>}
        {errors.items?.message && typeof errors.items.message === 'string' && <Text color="red" size="1" as="p" mb="2">{errors.items.message}</Text>}

        {isBrowser && (
            <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="checklistItemsDroppable">
                {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {fields.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(providedDraggable, snapshot) => (
                        <Card
                            ref={providedDraggable.innerRef}
                            {...providedDraggable.draggableProps}
                            className={`p-4 transition-shadow duration-150 rounded-md ${snapshot.isDragging ? 'shadow-xl bg-blue-50 dark:bg-blue-900/50' : 'shadow-sm bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700'}`}
                        >
                            <Flex align="start" gap="3">
                            <Box {...providedDraggable.dragHandleProps} className="pt-2 cursor-grab text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 active:cursor-grabbing">
                                <DragHandleDots2Icon width="20" height="20" />
                            </Box>
                            <Flex direction="column" gap="3" grow="1">
                                <div>
                                    <TextField.Root>
                                        <TextField.Input placeholder={`عنوان آیتم ${index + 1}`} {...register(`items.${index}.title`)} aria-label={`عنوان آیتم ${index + 1}`} className="dark:bg-gray-700 dark:text-white dark:border-gray-600"/>
                                    </TextField.Root>
                                    {errors.items?.[index]?.title && <Text color="red" size="1" as="p" mt="1">{errors.items[index]?.title?.message}</Text>}
                                </div>
                                <div>
                                    <TextField.Root>
                                        <TextField.Input placeholder="توضیحات آیتم (اختیاری)" {...register(`items.${index}.description`)} aria-label={`توضیحات آیتم ${index + 1}`} className="dark:bg-gray-700 dark:text-white dark:border-gray-600"/>
                                    </TextField.Root>
                                    {errors.items?.[index]?.description && <Text color="red" size="1" as="p" mt="1">{errors.items[index]?.description?.message}</Text>}
                                </div>
                            </Flex>
                            <IconButton
                                color="red"
                                variant="ghost" // تغییر به ghost برای ظاهر بهتر
                                onClick={() => fields.length > minItemsLength && remove(index)}
                                disabled={(fields.length <= minItemsLength) || isSubmitting}
                                type="button"
                                aria-label={`حذف آیتم ${index + 1}`}
                                className="rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"
                            >
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
        <Button type="button" onClick={() => append({ title: "", description: "" })} variant="soft" mt="4" disabled={isSubmitting} color="gray">
            <PlusIcon className="mr-1 rtl:ml-1 rtl:mr-0" /> اضافه کردن آیتم جدید
        </Button>
      </Card>

      <Flex justify="end" mt="6">
        <Button type="submit" size="3" disabled={isSubmitting} color="green" variant="solid">
            {isSubmitting ? "در حال ذخیره..." : "ذخیره الگوی چک لیست"}
        </Button>
      </Flex>
    </form>
  );
};

export default NewChecklistForm;
