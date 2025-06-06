// app/checklists/templates/[templateId]/_components/EditTemplateDetailsForm.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Heading, Box, Flex, TextField, Button, Callout, Text, Checkbox, Card, TextArea as RadixTextArea, IconButton, Separator } from '@radix-ui/themes';
import { useForm, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios, { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { Category, Tag, ChecklistTemplate, ChecklistItem } from '@prisma/client';
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Cross2Icon, DragHandleDots2Icon, PlusIcon, ArchiveIcon } from '@radix-ui/react-icons';

import { editTemplateFormSchema } from '../../../validationSchemas';
import { EditTemplateFormData, EditTemplateDetailsFormProps, ApiErrorResponse } from '../../../types';

interface ExtendedEditProps extends EditTemplateDetailsFormProps {
    template: EditTemplateDetailsFormProps['template'] & {
        isActive: boolean;
    };
}

const EditTemplateDetailsForm: React.FC<ExtendedEditProps> = ({ template, allCategories, allTags }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<EditTemplateFormData>({
    resolver: zodResolver(editTemplateFormSchema),
    defaultValues: {
      title: template.title,
      description: template.description || "",
      categoryIds: template.categories.map(cat => String(cat.id)),
      tagIds: template.tags.map(tag => String(tag.id)),
      items: template.items.sort((a,b) => a.order - b.order).map(item => ({
        id: item.id,
        title: item.title,
        description: item.description || "",
        order: item.order,
      })),
    },
    mode: "onChange"
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "items",
  });

  const templateDescriptionMDEOptions = useMemo(() => ({
    spellChecker: false, status: false, autosave: { enabled: false, uniqueId: `edit_template_desc_${template.id}` }
  }), [template.id]);
  
  const onSubmit: SubmitHandler<EditTemplateFormData> = async (data) => {
    if (!isDirty) {
        alert("هیچ تغییری برای ذخیره وجود ندارد.");
        return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const itemsToSubmit = data.items.map((item, index) => ({
        id: item.id,
        title: item.title,
        description: item.description || null,
        order: index, 
      }));

      const payload = {
        title: data.title,
        description: data.description || null,
        categoryIds: data.categoryIds?.map(id => parseInt(id, 10)).filter(id => !isNaN(id)) || [],
        tagIds: data.tagIds?.map(id => parseInt(id, 10)).filter(id => !isNaN(id)) || [],
        items: itemsToSubmit,
      };

      const response = await axios.patch(`/api/checklist-templates/${template.id}`, payload);
      
      reset({
        title: response.data.title,
        description: response.data.description || "",
        categoryIds: response.data.categories.map((cat: Category) => String(cat.id)),
        tagIds: response.data.tags.map((tag: Tag) => String(tag.id)),
        items: response.data.items.sort((a:ChecklistItem, b:ChecklistItem) => a.order - b.order).map((item: ChecklistItem) => ({
            id: item.id,
            title: item.title,
            description: item.description || "",
            order: item.order,
        })),
      });

      alert("جزئیات الگو با موفقیت به‌روزرسانی شد.");
      router.refresh(); 
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setSubmitError(axiosError.response?.data?.error || "خطا در به‌روزرسانی الگو.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    move(result.source.index, result.destination.index);
  };
  
  const handleArchiveToggle = async () => {
    if (isDirty) {
        alert("لطفاً ابتدا تغییرات خود را ذخیره کنید یا آنها را لغو نمایید.");
        return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await axios.patch(`/api/checklist-templates/${template.id}`, {
        isActive: !template.isActive,
      });
      alert(`الگو با موفقیت ${template.isActive ? 'آرشیو' : 'فعال'} شد.`);
      router.refresh();
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setSubmitError(axiosError.response?.data?.error || "خطا در تغییر وضعیت الگو.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="dir-rtl shadow-md rounded-lg dark:bg-gray-800">
      <Box p="4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Heading as="h3" size="5" mb="5" className="text-gray-700 dark:text-gray-200 border-b pb-3 dark:border-gray-700">ویرایش جزئیات و آیتم‌های الگو</Heading>
          {submitError && <Callout.Root color="red" mb="3" role="alert"><Callout.Text>{submitError}</Callout.Text></Callout.Root>}

          {/* بخش اصلی فرم */}
          <Flex direction="column" gap="4">
            {/* ... (کد فیلدهای عنوان، توضیحات، دسته‌بندی و برچسب) ... */}
            <div>
              <label htmlFor="edit-template-title-input"><Text size="2" weight="bold">عنوان الگو:</Text></label>
              <TextField.Input id="edit-template-title-input" {...register("title")} mt="1" />
              {errors.title && <Text color="red" size="1" as="p" mt="1">{errors.title.message}</Text>}
            </div>
            
            <Separator my="3" size="4" />

            <Heading as="h3" size="4" mb="3">آیتم‌های الگو</Heading>
             {isBrowser && (
                <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="editableChecklistItems">
                    {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                        {fields.map((item, index) => (
                        <Draggable key={item.id} draggableId={String(item.id || `new-item-${index}`)} index={index}>
                            {(providedDraggable, snapshot) => (
                                <Card {...providedDraggable.draggableProps} ref={providedDraggable.innerRef} className={`p-3 ${snapshot.isDragging ? 'shadow-xl' : 'shadow-sm'}`}>
                                    <Flex align="start" gap="3">
                                        <Box {...providedDraggable.dragHandleProps} className="pt-2 cursor-grab"><DragHandleDots2Icon /></Box>
                                        <Flex direction="column" gap="2" grow="1">
                                            <TextField.Input placeholder={`عنوان آیتم ${index + 1}`} {...register(`items.${index}.title`)} />
                                            <RadixTextArea placeholder="توضیحات آیتم (اختیاری)" {...register(`items.${index}.description`)} />
                                        </Flex>
                                        <IconButton color="red" variant="ghost" type="button" onClick={() => remove(index)}><Cross2Icon/></IconButton>
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
             <Button type="button" variant="soft" color="gray" onClick={() => append({ title: "", description: "", order: fields.length })}><PlusIcon/> اضافه کردن آیتم</Button>

          </Flex>
          
          <Flex justify="end" mt="6">
            <Button type="submit" disabled={isSubmitting || !isDirty} color="green" variant="solid">
              {isSubmitting ? "درحال ذخیره..." : "ذخیره تغییرات"}
            </Button>
          </Flex>
        </form>

        <Separator my="5" size="4" className="dark:border-gray-700"/>

        <Box>
            <Heading as="h3" size="4" mb="3" color="red">منطقه خطر</Heading>
            <Card variant="surface" style={{backgroundColor: 'var(--red-2)'}}>
                <Flex justify="between" align="center" p="3">
                    <Box>
                        <Text as="p" weight="bold" color="red">{template.isActive ? 'آرشیو کردن این الگو' : 'فعال کردن این الگو'}</Text>
                        <Text as="p" size="2" color="red" mt="1">{template.isActive ? 'الگوهای آرشیو شده قابل تخصیص نیستند.' : 'این الگو دوباره قابل استفاده خواهد بود.'}</Text>
                    </Box>
                    <Button color="red" variant="soft" onClick={handleArchiveToggle} disabled={isSubmitting}>
                        <ArchiveIcon />
                        {template.isActive ? 'آرشیو کردن' : 'فعال کردن'}
                    </Button>
                </Flex>
            </Card>
        </Box>
      </Box>
    </Card>
  );
};

export default EditTemplateDetailsForm;
