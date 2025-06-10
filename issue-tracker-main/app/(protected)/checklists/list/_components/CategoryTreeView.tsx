// app/checklists/list/_components/CategoryTreeView.tsx
"use client";

import React, { useState } from 'react';
import { Box, Flex, Text, IconButton, Button } from '@radix-ui/themes';
import { ChevronRightIcon, ChevronDownIcon, DotFilledIcon } from '@radix-ui/react-icons';
import { Category } from '@prisma/client';
import { useRouter, useSearchParams } from 'next/navigation';

// تایپ برای هر آیتم در درخت
export type CategoryTreeItem = Category & { children?: CategoryTreeItem[] };

interface CategoryNodeProps {
  node: CategoryTreeItem;
  onSelectCategory: (categoryName: string) => void;
  selectedCategory?: string;
  level: number;
}

const CategoryNode: React.FC<CategoryNodeProps> = ({ node, onSelectCategory, selectedCategory, level }) => {
  const [isOpen, setIsOpen] = useState(true);

  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedCategory === node.name;

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = () => {
    onSelectCategory(node.name);
  };

  return (
    <Box style={{ paddingRight: `${level * 16}px` }}>
      <Flex 
        align="center" 
        gap="1" 
        className={`p-1.5 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : ''}`}
      >
        {hasChildren ? (
          <IconButton variant="ghost" size="1" onClick={handleToggle} className="text-gray-500">
            {isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </IconButton>
        ) : (
          <DotFilledIcon className="w-4 h-4 text-gray-400" />
        )}
        <Text size="2" onClick={handleSelect} className="grow select-none">
          {node.name}
        </Text>
      </Flex>
      {/* اصلاح: استفاده از optional chaining (?.) برای جلوگیری از خطا */}
      {hasChildren && isOpen && (
        <Box mt="1">
          {node.children?.map(child => (
            <CategoryNode 
              key={child.id} 
              node={child} 
              onSelectCategory={onSelectCategory} 
              selectedCategory={selectedCategory} 
              level={level + 1} 
            />
          ))}
        </Box>
      )}
    </Box>
  );
};


interface CategoryTreeViewProps {
  categories: Category[]; // لیست تخت دسته‌بندی‌ها از سرور
  selectedCategory?: string;
}

const CategoryTreeView: React.FC<CategoryTreeViewProps> = ({ categories, selectedCategory }) => {
  const router = useRouter();
  const currentQueryParams = useSearchParams();

  // ساختار درختی از لیست تخت
  const buildTree = (items: Category[]): CategoryTreeItem[] => {
    const tree: CategoryTreeItem[] = [];
    const map: { [key: number]: CategoryTreeItem } = {};

    items.forEach(item => {
      map[item.id] = { ...item, children: [] };
    });

    items.forEach(item => {
      if (item.parentId && map[item.parentId]) {
        map[item.parentId].children?.push(map[item.id]);
      } else {
        tree.push(map[item.id]);
      }
    });

    return tree;
  };

  const categoryTree = buildTree(categories);

  const handleSelectCategory = (categoryName: string) => {
    const params = new URLSearchParams(currentQueryParams.toString());
    const currentCategory = params.get('category');

    if (currentCategory === categoryName || categoryName === '') {
      params.delete('category');
    } else {
      params.set('category', categoryName);
    }
    params.delete('page');
    params.set('tab', 'templates');
    router.push(`/checklists/list?${params.toString()}`);
  };

  return (
    <Flex direction="column" gap="2">
      {categoryTree.map(node => (
        <CategoryNode 
          key={node.id} 
          node={node} 
          onSelectCategory={handleSelectCategory} 
          selectedCategory={selectedCategory}
          level={0} 
        />
      ))}
       <Button variant="ghost" color="gray" mt="2" onClick={() => handleSelectCategory('')} className="justify-end">
        نمایش همه دسته‌بندی‌ها
       </Button>
    </Flex>
  );
};

export default CategoryTreeView;
