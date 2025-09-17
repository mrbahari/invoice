
'use client';

import Link from 'next/link';
import { PlusCircle, FilePen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { initialData } from '@/lib/data';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Category, Product } from '@/lib/definitions';
import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { useSearch } from '@/components/dashboard/search-provider';
import { CategoryForm } from '@/components/dashboard/category-form';

export default function CategoriesPage() {
  const [categoryList, setCategoryList] = useLocalStorage<Category[]>('categories', initialData.categories);
  const [products] = useLocalStorage<Product[]>('products', initialData.products);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'new' | null>(null);
  const { toast } = useToast();
  const { searchTerm } = useSearch();

  const categoriesById = useMemo(() => new Map(categoryList.map(c => [c.id, c])), [categoryList]);

  const getCategoryName = (categoryId: string) => {
    return categoriesById.get(categoryId)?.name;
  };

  const getRootParent = (categoryId: string): Category | undefined => {
    let current = categoriesById.get(categoryId);
    while (current && current.parentId) {
      const parent = categoriesById.get(current.parentId);
      if (!parent) return current; // Should not happen in clean data
      current = parent;
    }
    return current;
  };

  const getStoreName = (category: Category): string => {
    if (category.parentId) {
        const root = getRootParent(category.id);
        return root?.storeName || '-';
    }
    return category.storeName || '-';
  };
  
  const handleAddNew = () => {
    setSelectedCategory('new');
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
  };
  
  const handleBackToList = () => {
    setSelectedCategory(null);
  };

  const sortedAndFilteredCategories = useMemo(() => {
    const filtered = categoryList.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const filteredIds = new Set(filtered.map(c => c.id));

    const categoriesById = new Map(categoryList.map(c => [c.id, c]));
    
    // Function to check if a category should be in the final list (is in filtered list or one of its ancestors is)
    const isVisible = (cat: Category): boolean => {
        if (filteredIds.has(cat.id)) return true;
        if (!cat.parentId) return false;
        const parent = categoriesById.get(cat.parentId);
        return parent ? isVisible(parent) : false;
    }

    const visibleCategories = categoryList.filter(isVisible);
    const topLevelCategories = visibleCategories.filter(c => !c.parentId);
    
    const sorted: Category[] = [];
    
    const addChildrenToSortedList = (parentId: string) => {
        const children = visibleCategories
            .filter(child => child.parentId === parentId)
            .sort((a, b) => a.name.localeCompare(b.name));
            
        children.forEach(child => {
            sorted.push(child);
            addChildrenToSortedList(child.id); // Recursively find grandchildren
        });
    };
    
    topLevelCategories.sort((a, b) => a.name.localeCompare(b.name)).forEach(parent => {
      sorted.push(parent);
      addChildrenToSortedList(parent.id);
    });
    
    return sorted;
  }, [categoryList, searchTerm]);
  
  const getProductCount = (categoryId: string) => {
    return products.filter(p => p.categoryId === categoryId).length;
  };

  if (selectedCategory) {
    const categoryToEdit = selectedCategory === 'new' ? undefined : selectedCategory;
    return <CategoryForm category={categoryToEdit} onBack={handleBackToList} />;
  }


  return (
    <Card className="animate-fade-in-up">
      <CardHeader>
        <div className='flex justify-between items-center gap-4'>
            <div>
                <CardTitle>دسته‌بندی‌ها</CardTitle>
                <CardDescription>
                دسته‌بندی‌ها و زیرمجموعه‌های محصولات خود را مدیریت کنید.
                </CardDescription>
            </div>
            <div className="flex items-center gap-2">
            <Button size="sm" className="h-8 gap-1" onClick={handleAddNew}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              افزودن دسته‌بندی
              </span>
            </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>نام دسته‌بندی</TableHead>
              <TableHead>دسته‌بندی والد</TableHead>
              <TableHead>فروشگاه</TableHead>
              <TableHead className="text-left">محصولات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredCategories.map((category) => {
              const indentation = getIndentation(category);
              return (
              <TableRow 
                key={category.id} 
                onClick={() => handleEdit(category)}
                className={`cursor-pointer transition-all hover:shadow-md hover:-translate-y-1 ${category.parentId ? 'bg-muted/50' : ''}`}
              >
                <TableCell className="font-medium" style={{ paddingRight: `${1 + indentation * 1.5}rem` }}>
                  {category.parentId && '– '}
                  {category.name}
                </TableCell>
                <TableCell>
                  {category.parentId ? (
                     <Badge variant="outline">{getCategoryName(category.parentId)}</Badge>
                  ) : (
                    <span className='text-muted-foreground'>-</span>
                  )}
                </TableCell>
                <TableCell>{getStoreName(category)}</TableCell>
                <TableCell className="text-left">
                  {getProductCount(category.id)}
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </CardContent>
       <CardFooter>
        <div className="text-xs text-muted-foreground">
          نمایش <strong>{sortedAndFilteredCategories.length}</strong> از <strong>{categoryList.length}</strong> دسته‌بندی
        </div>
      </CardFooter>
    </Card>
  );
}
