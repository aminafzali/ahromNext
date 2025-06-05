"use client";

import { Button, TextField, Card, Flex, IconButton, Text, Box, Callout } from "@radix-ui/themes";
import React, { useState, useEffect, useMemo } from "react";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import { useForm, useFieldArray, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Cross2Icon, DragHandleDots2Icon, PlusIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import { DropResult, DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

// Schema برای اعتبارسنجی آیتم چک‌لیست با Zod (بدون order در اینجا)
const checklistItemClientSchema = z.object({
  title: z.string().min(1, "عنوان آیتم الزامی است.").max(255, "عنوان آیتم نمی‌تواند بیشتر از ۲۵۵ کاراکتر باشد."),
  description: z.string().max(65535, "توضیحات آیتم بیش از حد طولانی است.").optional(),
});

// Schema برای اعتبارسنجی الگوی چک‌لیست با Zod
const checklistTemplateClientSchema = z.object({
  templateTitle: z.string().min(1, "نام الگو الزامی است.").max(255, "نام الگو نمی‌تواند بیشتر از ۲۵۵ کاراکتر باشد."),
  templateDescription: z.string().max(65535, "توضیحات الگو بیش از حد طولانی است.").optional(),
  items: z.array(checklistItemClientSchema).min(1, "حداقل یک آیتم برای الگو الزامی است."), // .min(1) مهم است
});

export type ChecklistTemplateFormData = z.infer<typeof checklistTemplateClientSchema>;

interface ChecklistItemWithOrder extends z.infer<typeof checklistItemClientSchema> {
  order: number;
}

interface ChecklistTemplatePayload {
  templateTitle: string;
  templateDescription?: string;
  items: ChecklistItemWithOrder[];
}

interface ApiErrorResponse {
  error: string;
  details?: any[];
}

const NewCheckListPage: React.FC = () => {
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
  } = useForm<ChecklistTemplateFormData>({
    resolver: zodResolver(checklistTemplateClientSchema),
    defaultValues: {
      templateTitle: "",
      templateDescription: "",
      items: [{ title: "", description: "" }],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "items",
  });

  const simpleMDEOptions = useMemo(() => {
    return {
      spellChecker: false,
      status: false,
      autosave: {
        enabled: false,
        uniqueId: "templateDescription_new_page_v3_final" // شناسه منحصر به فرد
      },
    };
  }, []);

  // استخراج حداقل تعداد آیتم‌های مورد نیاز از schema
  const minItemsLength = checklistTemplateClientSchema.shape.items._def.minLength?.value ?? 0;


  const onSubmitHandler: SubmitHandler<ChecklistTemplateFormData> = async (data) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const itemsWithOrder: ChecklistItemWithOrder[] = data.items.map((item, index) => ({
        ...item,
        order: index,
      }));

      const payload: ChecklistTemplatePayload = {
        templateTitle: data.templateTitle,
        templateDescription: data.templateDescription,
        items: itemsWithOrder,
      };

      await axios.post("/api/checklist-templates", payload);
      router.push("/"); // یا مسیر دلخواه دیگر
    } catch (err) {
      setIsSubmitting(false);
      const axiosError = err as AxiosError<ApiErrorResponse>;
      if (axiosError.response && axiosError.response.data && axiosError.response.data.error) {
        setSubmitError(axiosError.response.data.error);
      } else {
        setSubmitError("خطایی در ایجاد الگو رخ داد. لطفاً دوباره تلاش کنید.");
      }
      console.error("Submit error details:", err);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    move(result.source.index, result.destination.index);
  };

  const addNewItem = () => {
    append({ title: "", description: "" });
  };

  const removeItem = (index: number) => {
    if (fields.length > minItemsLength) { // استفاده از minItemsLength استخراج شده
        remove(index);
    } else {
        setSubmitError(`حداقل ${minItemsLength} آیتم برای الگو الزامی است.`);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto p-4 md:p-6 lg:p-8">
      {submitError && (
        <Callout.Root color="red" className="mb-5">
          <Callout.Text>{submitError}</Callout.Text>
        </Callout.Root>
      )}
      <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6">
        <div>
          {/* اصلاح: استفاده از تگ label به جای Box as="label" */}
          <label htmlFor="templateTitle" className="block mb-1">
            <Text size="2" weight="bold">نام الگوی چک لیست</Text>
          </label>
          <TextField.Root>
            <TextField.Input
              id="templateTitle"
              placeholder="مثال: چک لیست آماده‌سازی قبل از انتشار"
              {...register("templateTitle")}
              size="3"
              autoFocus
            />
          </TextField.Root>
          {errors.templateTitle && (
            <Text color="red" size="1" as="p" className="mt-1">
              {errors.templateTitle.message}
            </Text>
          )}
        </div>

        <div>
          {/* اصلاح: استفاده از تگ label به جای Box as="label" */}
          <label htmlFor="templateDescription" className="block mb-1">
            <Text size="2" weight="bold">توضیحات الگو (اختیاری)</Text>
          </label>
          <Controller
            name="templateDescription"
            control={control}
            render={({ field }) => (
              <SimpleMDE
                id="templateDescription"
                placeholder="جزئیات بیشتر در مورد این الگو..."
                value={field.value || ""}
                onChange={field.onChange}
                options={simpleMDEOptions}
              />
            )}
          />
          {errors.templateDescription && (
            <Text color="red" size="1" as="p" className="mt-1">
              {errors.templateDescription.message}
            </Text>
          )}
        </div>

        <div className="border-t pt-6 mt-6">
          <Text as="p" size="3" weight="bold" className="block mb-3">آیتم‌های چک‌لیست:</Text>
          {errors.items?.root && (
             <Text color="red" size="1" as="p" className="mt-1 mb-2">
               {errors.items.root.message}
             </Text>
          )}
          {errors.items?.message && typeof errors.items.message === 'string' && (
              <Text color="red" size="1" as="p" className="mt-1 mb-2">
                {errors.items.message}
              </Text>
          )}

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
                            className={`p-4 transition-shadow duration-150 ${snapshot.isDragging ? 'shadow-lg bg-slate-50' : 'shadow-sm bg-white'}`}
                          >
                            <Flex align="start" gap="3">
                              <Box {...providedDraggable.dragHandleProps} className="pt-2 cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing">
                                <DragHandleDots2Icon width="20" height="20" />
                              </Box>
                              <Flex direction="column" gap="2" grow="1">
                                <TextField.Root>
                                  <TextField.Input
                                    placeholder={`عنوان آیتم ${index + 1}`}
                                    {...register(`items.${index}.title`)}
                                    aria-label={`عنوان آیتم ${index + 1}`}
                                  />
                                </TextField.Root>
                                {errors.items?.[index]?.title && (
                                  <Text color="red" size="1" as="p">
                                    {errors.items[index]?.title?.message}
                                  </Text>
                                )}
                                <TextField.Root>
                                   <TextField.Input
                                    placeholder="توضیحات آیتم (اختیاری)"
                                    {...register(`items.${index}.description`)}
                                    aria-label={`توضیحات آیتم ${index + 1}`}
                                  />
                                </TextField.Root>
                                 {errors.items?.[index]?.description && (
                                  <Text color="red" size="1" as="p">
                                    {errors.items[index]?.description?.message}
                                  </Text>
                                )}
                              </Flex>
                              <IconButton
                                color="red"
                                variant="soft"
                                onClick={() => removeItem(index)}
                                disabled={(fields.length <= minItemsLength) || isSubmitting}
                                type="button"
                                aria-label={`حذف آیتم ${index + 1}`}
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
        </div>

        <Button
          type="button"
          onClick={addNewItem}
          variant="soft"
          className="mt-4"
          disabled={isSubmitting}
        >
          <PlusIcon className="mr-2 rtl:ml-2 rtl:mr-0" /> اضافه کردن آیتم جدید
        </Button>

        <Button type="submit" size="3" disabled={isSubmitting} className="mt-8 w-full md:w-auto">
          {isSubmitting ? "در حال ذخیره..." : "ذخیره الگوی چک لیست"}
        </Button>
      </form>
    </div>
  );
};

export default NewCheckListPage;
