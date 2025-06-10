// app/checklists/list/_components/ChecklistSettings.tsx
"use client";

import React, { useState, useEffect, FormEvent } from 'react';
// Spinner از ایمپورت حذف شد
import { Heading, Box, Flex, TextField, Button, Callout, Text, IconButton, Card, Separator, Tooltip, Dialog, Select, Badge } from '@radix-ui/themes';
import { PlusIcon, TrashIcon, Pencil1Icon, ChevronDownIcon, ChevronRightIcon, DotFilledIcon } from '@radix-ui/react-icons';
import axios, { AxiosError } from 'axios';
import { Category, Tag } from '@prisma/client';

// ========== تایپ‌های لازم ==========
interface SettingsItem {
  id: number;
  name: string;
}
interface TagItem extends Tag {}
interface CategoryItem extends Category {
  children: CategoryItem[];
}
type ItemType = 'category' | 'tag';
interface ApiError {
  error: string;
  details?: any;
}
const radixColors = ["gray", "gold", "bronze", "brown", "yellow", "amber", "orange", "tomato", "red", "ruby", "crimson", "pink", "plum", "purple", "violet", "indigo", "blue", "cyan", "teal", "jade", "green", "grass", "lime", "mint", "sky"] as const;


// ========== کامپوننت ویرایش آیتم (دسته‌بندی یا برچسب) در یک Dialog ==========
// این کامپوننت به بیرون منتقل شد تا توسط هر دو بخش قابل استفاده باشد
const EditItemDialog = ({
  item,
  itemType,
  allCategories, // برای ویرایش والد دسته‌بندی
  onSave,
  onClose,
}: {
  item: SettingsItem | TagItem;
  itemType: ItemType;
  allCategories?: Category[];
  onSave: (id: number, data: { name?: string; color?: string; parentId?: number | null }) => Promise<void>;
  onClose: () => void;
}) => {
  const [name, setName] = useState(item.name);
  const [color, setColor] = useState((item as TagItem).color || 'gray');
  const [parentId, setParentId] = useState(String((item as CategoryItem).parentId || 'null'));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("نام نمی‌تواند خالی باشد."); return; }
    setIsSubmitting(true);
    setError(null);
    try {
      const dataToSave: { name: string; color?: string; parentId?: number | null } = { name };
      if (itemType === 'tag') {
        dataToSave.color = color;
      }
      if (itemType === 'category') {
        dataToSave.parentId = parentId === 'null' ? null : parseInt(parentId);
      }
      await onSave(item.id, dataToSave);
      onClose();
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      setError(axiosError.response?.data?.error || `خطا در به‌روزرسانی.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const possibleParents = allCategories?.filter(cat => cat.id !== item.id) || [];

  return (
    <Dialog.Root open onOpenChange={onClose}>
      <Dialog.Content style={{ maxWidth: 450 }} dir="rtl">
        <Dialog.Title className="text-right">ویرایش {itemType === 'category' ? 'دسته‌بندی' : 'برچسب'}</Dialog.Title>
        {error && <Callout.Root color="red" my="3"><Callout.Text>{error}</Callout.Text></Callout.Root>}
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3" mt="4">
            <label>
              <Text as="div" size="2" mb="1" weight="bold" className="text-right">نام:</Text>
              <TextField.Input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            {itemType === 'tag' && (
              <label>
                <Text as="div" size="2" mb="1" weight="bold" className="text-right">رنگ:</Text>
                <Select.Root value={color} onValueChange={setColor}>
                  <Select.Trigger className="w-full" />
                  <Select.Content>
                    {radixColors.map(c => (
                      <Select.Item key={c} value={c}>
                        <Flex align="center" gap="2">
                          <Box style={{width:'14px', height:'14px', backgroundColor: `var(--${c}-9)`}} className="rounded-full" />
                          {c}
                        </Flex>
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </label>
            )}
            {itemType === 'category' && (
                <label>
                    <Text as="div" size="2" mb="1" weight="bold">والد:</Text>
                    <Select.Root value={parentId} onValueChange={setParentId}>
                        <Select.Trigger className="w-full" />
                        <Select.Content>
                            <Select.Item value="null">بدون والد (اصلی)</Select.Item>
                            {possibleParents.map(p => <Select.Item key={p.id} value={String(p.id)}>{p.name}</Select.Item>)}
                        </Select.Content>
                    </Select.Root>
                </label>
            )}
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" type="button">انصراف</Button>
            </Dialog.Close>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "درحال ذخیره..." : "ذخیره تغییرات"}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
};

// ========== کامپوننت مدیریت برچسب‌ها ==========
const ManageTagsSection = () => {
    const [tags, setTags] = useState<TagItem[]>([]);
    const [newItemName, setNewItemName] = useState('');
    const [newItemColor, setNewItemColor] = useState<string>('gray');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingItem, setEditingItem] = useState<TagItem | null>(null);

    const apiEndpoint = '/api/tags';

    const fetchTags = async () => {
        setIsLoading(true); setError(null);
        try {
            const response = await axios.get<TagItem[]>(apiEndpoint);
            setTags(response.data.sort((a,b) => a.name.localeCompare(b.name, 'fa')));
        } catch (err) { setError("خطا در دریافت لیست برچسب‌ها."); } 
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchTags(); }, []);

    const handleAddTag = async (e: FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim()) { setSubmitError("نام برچسب نمی‌تواند خالی باشد."); return; }
        setIsSubmitting(true); setSubmitError(null);
        try {
            const response = await axios.post<TagItem>(apiEndpoint, { name: newItemName, color: newItemColor });
            setTags(prev => [...prev, response.data].sort((a,b) => a.name.localeCompare(b.name, 'fa')));
            setNewItemName(''); setNewItemColor('gray');
        } catch (err) {
            const axiosError = err as AxiosError<ApiError>;
            setSubmitError(axiosError.response?.data?.error || "خطا در افزودن برچسب.");
        } finally { setIsSubmitting(false); }
    };
    
    const handleSaveEdit = async (id: number, data: { name?: string; color?: string }) => {
        await axios.patch(`${apiEndpoint}/${id}`, data);
        await fetchTags();
    };
    
    const handleDeleteTag = async (tagId: number) => {
        if (!window.confirm("آیا از حذف این برچسب مطمئن هستید؟")) return;
        try {
            await axios.delete(`${apiEndpoint}/${tagId}`);
            setTags(tags.filter(tag => tag.id !== tagId));
        } catch (err) {
            const axiosError = err as AxiosError<ApiError>;
            alert(axiosError.response?.data?.error || "خطا در حذف برچسب.");
        }
    };

    if (isLoading) return <Flex justify="center" p="5"><Text>درحال بارگذاری...</Text></Flex>;
    if (error) return <Callout.Root color="red" role="alert"><Callout.Text>{error}</Callout.Text></Callout.Root>;

    return (
        <Card variant="surface" className="dir-rtl shadow-md dark:bg-gray-800 rounded-lg p-4">
            <Heading as="h3" size="5" mb="4" className="text-right text-gray-800 dark:text-gray-100">مدیریت برچسب‌ها</Heading>
            {submitError && <Callout.Root color="red" mb="3" role="alert"><Callout.Text>{submitError}</Callout.Text></Callout.Root>}
            <form onSubmit={handleAddTag}>
                <Flex gap="3" align="end" mb="4">
                    <Box style={{ flexGrow: 1 }}>
                        <label htmlFor="tag-name-input">
                            <Text as="div" size="2" mb="1" className="text-right">نام برچسب جدید:</Text>
                        </label>
                        <TextField.Input id="tag-name-input" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} required />
                    </Box>
                     <Box style={{ flexBasis: '150px' }}>
                        <label htmlFor="tag-color-select">
                            <Text as="div" size="2" mb="1" className="text-right">رنگ:</Text>
                        </label>
                        <Select.Root value={newItemColor} onValueChange={setNewItemColor} >
                            <Select.Trigger id="tag-color-select" className="w-full" />
                            <Select.Content>
                                {radixColors.map(c => <Select.Item key={c} value={c}><Flex align="center" gap="2"><Box style={{width:'14px', height:'14px', backgroundColor: `var(--${c}-9)`}} className="rounded-full" />{c}</Flex></Select.Item>)}
                            </Select.Content>
                        </Select.Root>
                    </Box>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "..." : <PlusIcon />} افزودن</Button>
                </Flex>
            </form>
            
            <Box className="border border-gray-200 dark:border-gray-700 rounded-md" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {tags.map((tag) => (
                    <Flex key={tag.id} justify="between" align="center" p="2" className={`border-b border-gray-200 dark:border-gray-700 last:border-b-0`}>
                        <Badge color={tag.color as any} variant="solid" radius="full">{tag.name}</Badge>
                        <Flex align="center" gap="1">
                            <Tooltip content="ویرایش"><IconButton color="gray" variant="ghost" size="1" onClick={() => setEditingItem(tag)}><Pencil1Icon /></IconButton></Tooltip>
                            <Tooltip content="حذف"><IconButton color="red" variant="ghost" size="1" onClick={() => handleDeleteTag(tag.id)}><TrashIcon /></IconButton></Tooltip>
                        </Flex>
                    </Flex>
                ))}
            </Box>
            {editingItem && (
                <EditItemDialog
                    item={editingItem}
                    itemType="tag"
                    onSave={handleSaveEdit}
                    onClose={() => setEditingItem(null)}
                />
            )}
        </Card>
    );
};

// ========== کامپوننت مدیریت دسته‌بندی‌ها ==========
const ManageCategoriesSection = () => {
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const [categoryTree, setCategoryTree] = useState<CategoryItem[]>([]);
    const [newItemName, setNewItemName] = useState('');
    const [newParentId, setNewParentId] = useState<string>('null');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingItem, setEditingItem] = useState<Category | null>(null);

    const apiEndpoint = '/api/categories';

    const buildTree = (items: Category[]): CategoryItem[] => {
        const tree: CategoryItem[] = [];
        const map: { [key: number]: CategoryItem } = {};
        items.forEach(item => { map[item.id] = { ...item, children: [] }; });
        items.forEach(item => {
            if (item.parentId && map[item.parentId]) {
                map[item.parentId].children.push(map[item.id]);
            } else {
                tree.push(map[item.id]);
            }
        });
        return tree;
    };

    const fetchCategories = async () => {
        setIsLoading(true); setError(null);
        try {
            const response = await axios.get<Category[]>(apiEndpoint);
            setAllCategories(response.data);
            setCategoryTree(buildTree(response.data));
        } catch (err) { setError("خطا در دریافت لیست دسته‌بندی‌ها."); } 
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchCategories(); }, []);

    const handleAddCategory = async (e: FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim()) { setSubmitError("نام دسته‌بندی نمی‌تواند خالی باشد."); return; }
        setIsSubmitting(true); setSubmitError(null);
        try {
            const parentId = newParentId === 'null' ? null : parseInt(newParentId);
            await axios.post<Category>(apiEndpoint, { name: newItemName, parentId });
            setNewItemName(''); setNewParentId('null');
            await fetchCategories();
        } catch (err) {
            const axiosError = err as AxiosError<ApiError>;
            setSubmitError(axiosError.response?.data?.error || "خطا در افزودن دسته‌بندی.");
        } finally { setIsSubmitting(false); }
    };
    
    const handleSaveEdit = async (id: number, data: { name?: string; parentId?: number | null }) => {
        await axios.patch(`${apiEndpoint}/${id}`, data);
        await fetchCategories();
    };
    
    const handleDeleteCategory = async (categoryId: number) => {
        if (!window.confirm("آیا از حذف این دسته‌بندی مطمئن هستید؟ (اگر زیرمجموعه داشته باشد حذف نخواهد شد)")) return;
        try {
            await axios.delete(`${apiEndpoint}/${categoryId}`);
            await fetchCategories();
        } catch (err) {
            const axiosError = err as AxiosError<ApiError>;
            alert(axiosError.response?.data?.error || "خطا در حذف دسته‌بندی.");
        }
    };
    
    const CategoryNode = ({ node, level }: { node: CategoryItem, level: number }) => {
        const [isOpen, setIsOpen] = useState(true);
        const hasChildren = node.children && node.children.length > 0;
        
        return (
            <Box style={{ paddingRight: `${level * 20}px` }}>
                <Flex align="center" p="1" className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
                    <IconButton variant="ghost" size="1" color="gray" onClick={() => setIsOpen(!isOpen)} disabled={!hasChildren}>
                        {hasChildren ? (isOpen ? <ChevronDownIcon/> : <ChevronRightIcon/>) : <DotFilledIcon />}
                    </IconButton>
                    <Text size="2" className="grow">{node.name}</Text>
                     <Flex align="center" gap="1">
                        <Tooltip content="ویرایش"><IconButton color="gray" variant="ghost" size="1" onClick={() => setEditingItem(node)}><Pencil1Icon /></IconButton></Tooltip>
                        <Tooltip content="حذف"><IconButton color="red" variant="ghost" size="1" onClick={() => handleDeleteCategory(node.id)}><TrashIcon /></IconButton></Tooltip>
                    </Flex>
                </Flex>
                {hasChildren && isOpen && <Box mt="1" className="border-r-2 border-gray-200 dark:border-gray-700 mr-2 pr-2">{node.children.map(child => <CategoryNode key={child.id} node={child} level={level + 1} />)}</Box>}
            </Box>
        )
    };

    if (isLoading) return <Flex justify="center" p="5"><Text>درحال بارگذاری...</Text></Flex>;
    if (error) return <Callout.Root color="red" role="alert"><Callout.Text>{error}</Callout.Text></Callout.Root>;

    return (
        <Card variant="surface" className="dir-rtl shadow-md dark:bg-gray-800 rounded-lg p-4">
            <Heading as="h3" size="5" mb="4" className="text-right text-gray-800 dark:text-gray-100">مدیریت دسته‌بندی‌ها</Heading>
             {submitError && <Callout.Root color="red" mb="3" role="alert"><Callout.Text>{submitError}</Callout.Text></Callout.Root>}
            <form onSubmit={handleAddCategory}>
                <Flex gap="3" align="end" mb="4">
                    <Box style={{ flexGrow: 1 }}>
                        <label htmlFor="cat-name-input">
                            <Text as="div" size="2" mb="1" className="text-right">نام دسته‌بندی جدید:</Text>
                        </label>
                        <TextField.Input id="cat-name-input" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} required />
                    </Box>
                    <Box style={{ flexBasis: '200px' }}>
                        <label htmlFor="cat-parent-select">
                            <Text as="div" size="2" mb="1" className="text-right">انتخاب والد:</Text>
                        </label>
                        <Select.Root value={newParentId} onValueChange={setNewParentId}>
                            <Select.Trigger id="cat-parent-select" className="w-full" />
                            <Select.Content>
                                <Select.Item value="null">بدون والد (دسته اصلی)</Select.Item>
                                {allCategories.map(cat => <Select.Item key={cat.id} value={String(cat.id)}>{cat.name}</Select.Item>)}
                            </Select.Content>
                        </Select.Root>
                    </Box>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "..." : <PlusIcon />} افزودن</Button>
                </Flex>
            </form>

            <Box className="border border-gray-200 dark:border-gray-700 rounded-md p-2" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {categoryTree.length > 0 ? categoryTree.map(node => <CategoryNode key={node.id} node={node} level={0} />) : <Text color="gray" size="2" className="text-center py-3 italic">موردی یافت نشد.</Text>}
            </Box>
            {editingItem && (
                <EditItemDialog
                    item={editingItem}
                    itemType="category"
                    allCategories={allCategories}
                    onSave={handleSaveEdit}
                    onClose={() => setEditingItem(null)}
                />
            )}
        </Card>
    );
};

// ========== کامپوننت اصلی تنظیمات ==========
const ChecklistSettings = () => {
  return (
    <Box className="max-w-5xl mx-auto p-4 md:p-0">
      <Heading as="h2" size="6" mb="5" className="text-right text-gray-800 dark:text-gray-100">تنظیمات عمومی چک‌لیست</Heading>
      <Flex direction="column" gap="6">
        <ManageCategoriesSection />
        <Separator my="5" size="4" className="dark:border-gray-700" />
        <ManageTagsSection />
      </Flex>
    </Box>
  );
};

export default ChecklistSettings;
