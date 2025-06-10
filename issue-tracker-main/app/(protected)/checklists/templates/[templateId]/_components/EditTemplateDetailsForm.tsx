// app/checklists/templates/[templateId]/_components/EditTemplateDetailsForm.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Heading, Box, Flex, TextField, Button, Callout, Text, Checkbox, Card, TextArea as RadixTextArea, IconButton, Separator } from '@radix-ui/themes';
import { useForm, SubmitHandler, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios, { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { Category, Tag, ChecklistItem, ChecklistTemplate } from '@prisma/client';
import dynamic from 'next/dynamic';
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Cross2Icon, DragHandleDots2Icon, PlusIcon, ArchiveIcon } from '@radix-ui/react-icons';

import { templateFormSchema } from '@/app/checklists/validationSchemas';
import { TemplateFormData, EditTemplateDetailsFormProps, ApiErrorResponse, TemplateCategory, TemplateTag } from '@/app/checklists/types';

const SimpleMDE = dynamic(() => import('react-simplemde-editor'), {
    ssr: false,
    loading: () => <Text>درحال بارگذاری ویرایشگر...</Text>
});
import "easymde/dist/easymde.min.css";

interface ExtendedEditProps extends EditTemplateDetailsFormProps {
  template: EditTemplateDetailsFormProps['template'] & { isActive: boolean; };
}

const EditTemplateDetailsForm: React.FC<ExtendedEditProps> = ({ template, allCategories, allTags }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => { setIsBrowser(true); }, []);

  const {
    register, control, handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      title: template.title,
      description: template.description || "",
      categoryIds: template.categories.map(c => String(c.categoryId)),
      tagIds: template.tags.map(t => String(t.tagId)),
      items: template.items.sort((a,b) => a.order - b.order).map(item => ({
        id: item.id,
        title: item.title,
        description: item.description || "",
        order: item.order,
      })),
    },
    mode: "onChange"
  });

  const { fields, append, remove, move } = useFieldArray({ control, name: "items" });
  const simpleMDEOptions = useMemo(() => ({ spellChecker: false, status: false, placeholder: "توضیحات الگو..." }), []);

  const onSubmit: SubmitHandler<TemplateFormData> = async (data) => {
    if (!isDirty) {
      alert("هیچ تغییری برای ذخیره وجود ندارد.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        title: data.title,
        description: data.description || null,
        categoryIds: data.categoryIds?.map(id => parseInt(id)).filter(id => !isNaN(id)) || [],
        tagIds: data.tagIds?.map(id => parseInt(id)).filter(id => !isNaN(id)) || [],
        items: data.items.map((item, index) => ({ id: item.id, title: item.title, description: item.description || null, order: index })),
      };

      const response = await axios.patch(`/api/checklist-templates/${template.id}`, payload);

      reset({
        title: response.data.title,
        description: response.data.description || "",
        categoryIds: response.data.categories.map((c: TemplateCategory) => String(c.categoryId)),
        tagIds: response.data.tags.map((t: TemplateTag) => String(t.tagId)),
        items: response.data.items.sort((a: ChecklistItem, b: ChecklistItem) => a.order - b.order).map((item: ChecklistItem) => ({
          id: item.id,
          title: item.title,
          description: item.description || "",
          order: item.order,
        })),
      });

      alert("الگو با موفقیت به‌روزرسانی شد.");
      router.refresh();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setSubmitError(axiosError.response?.data?.error || "خطا در به‌روزرسانی الگو.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveToggle = async () => {
    if (isDirty) {
      alert("لطفاً ابتدا تغییرات خود را ذخیره کنید یا آنها را لغو نمایید.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await axios.patch(`/api/checklist-templates/${template.id}`, { isActive: !template.isActive });
      alert(`الگو با موفقیت ${template.isActive ? 'آرشیو' : 'فعال'} شد.`);
      router.refresh();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setSubmitError(axiosError.response?.data?.error || "خطا در تغییر وضعیت الگو.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    move(result.source.index, result.destination.index);
  };

  const addNewItem = () => {
    append({ title: "", description: "", order: fields.length });
  };

  const renderCheckboxGroup = (items: Array<{ id: number; name: string }>, fieldName: 'categoryIds' | 'tagIds') => (
    <Controller
      control={control}
      name={fieldName}
      render={({ field: { value = [], onChange } }) => (
        <Flex direction="column" gap="2" className="max-h-40 overflow-y-auto border p-3 rounded-md dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30">
          {items.map(item => {
            const isChecked = value.includes(String(item.id));
            const handleChange = (checked: boolean) => {
              if (checked) onChange([...value, String(item.id)]);
              else onChange(value.filter((id: string) => id !== String(item.id)));
            };
            return (
              <label key={item.id} htmlFor={`edit-${fieldName}-${item.id}`} className="flex items-center gap-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600/50 cursor-pointer rounded">
                <Checkbox id={`edit-${fieldName}-${item.id}`} checked={isChecked} onCheckedChange={handleChange} />
                <Text size="2" className="text-gray-700 dark:text-gray-200 select-none">{item.name}</Text>
              </label>
            );
          })}
        </Flex>
      )}
    />
  );

  return (
    <Card className="dir-rtl shadow-md rounded-lg dark:bg-gray-800">
      <Box p="4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Heading as="h3" size="5" mb="5" className="text-gray-700 dark:text-gray-200 border-b pb-3 dark:border-gray-700">ویرایش جزئیات و آیتم‌های الگو</Heading>
          {submitError && <Callout.Root color="red" mb="3"><Callout.Text>{submitError}</Callout.Text></Callout.Root>}

          <Flex direction="column" gap="4">
            <div>
              <label htmlFor="edit-title"><Text size="2" weight="bold">عنوان الگو:</Text></label>
              <TextField.Input id="edit-title" {...register("title" as const)} mt="1" />
              {errors.title && <Text color="red" size="1" as="p" mt="1">{errors.title.message}</Text>}
            </div>
            <div>
              <label htmlFor="edit-desc"><Text size="2" weight="bold">توضیحات:</Text></label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => <SimpleMDE id="edit-desc" value={field.value || ""} onChange={field.onChange} />}
              />
            </div>
          </Flex>

          <Separator my="5" size="4" />

          {allCategories.length > 0 && (
            <div>
              <Text as="p" size="2" weight="bold" mb="2">دسته‌بندی‌ها:</Text>
              {renderCheckboxGroup(allCategories, 'categoryIds')}
            </div>
          )}

          {allTags.length > 0 && (
            <div>
              <Text as="p" size="2" weight="bold" mb="2">برچسب‌ها:</Text>
              {renderCheckboxGroup(allTags, 'tagIds')}
            </div>
          )}

          <Separator my="5" size="4" />

          <Heading as="h3" size="4" mb="3">آیتم‌های الگو</Heading>
          {errors.items && <Text color="red" size="1" as="p" mb="2">{errors.items?.message || "خطا در آیتم‌ها"}</Text>}
          {isBrowser && (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="editable-items">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {fields.map((field, index) => (
                      <Draggable key={field.id} draggableId={field.id} index={index}>
                        {(providedDraggable, snapshot) => (
                          <Card {...providedDraggable.draggableProps} ref={providedDraggable.innerRef} className={`p-3 transition-shadow ${snapshot.isDragging ? 'shadow-xl' : 'shadow-sm'}`}>
                            <Flex align="start" gap="2">
                              <Box {...providedDraggable.dragHandleProps} className="pt-2 cursor-grab"><DragHandleDots2Icon /></Box>
                              <Flex direction="column" grow="1" gap="2">
                                <TextField.Input placeholder={`عنوان آیتم ${index + 1}`} {...register(`items.${index}.title` as const)} />
                                <RadixTextArea placeholder="توضیحات (اختیاری)" {...register(`items.${index}.description` as const)} className="min-h-[60px]" />
                              </Flex>
                              <IconButton variant="ghost" color="red" type="button" onClick={() => remove(index)}><Cross2Icon/></IconButton>
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
          <Button type="button" variant="soft" mt="3" onClick={addNewItem}><PlusIcon/> اضافه کردن آیتم</Button>

          <Flex justify="end" mt="6">
            <Button type="submit" disabled={isSubmitting || !isDirty} color="green">
              {isSubmitting ? "درحال ذخیره..." : "ذخیره تغییرات"}
            </Button>
          </Flex>
        </form>

        <Separator my="5" size="4" />

        <Box>
            <Heading as="h3" size="4" mb="3" color="red">منطقه خطر</Heading>
            <Card variant="surface" style={{backgroundColor: 'var(--red-2)'}}>
                <Flex justify="between" align="center" p="3">
                    <Box>
                        <Text as="p" weight="bold" color="red">{template.isActive ? 'آرشیو کردن الگو' : 'فعال کردن الگو'}</Text>
                        <Text as="p" size="2" color="red" mt="1">{template.isActive ? 'این الگو دیگر قابل تخصیص نخواهد بود.' : 'این الگو دوباره قابل استفاده خواهد بود.'}</Text>
                    </Box>
                    <Button color="red" variant="soft" onClick={handleArchiveToggle} disabled={isSubmitting}>
                        <ArchiveIcon />{template.isActive ? 'آرشیو' : 'فعال‌سازی'}
                    </Button>
                </Flex>
            </Card>
        </Box>
      </Box>
    </Card>
  );
};

export default EditTemplateDetailsForm;
