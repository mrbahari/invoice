
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
  const [categoryList, setCategoryList, reloadCategories] = useLocalStorage<Category[]>('categories', initialData.categories);
  const [products, , reloadProducts] = useLocalStorage<Product[]>('products', initialData.products);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'new' | null>(null);
  const { toast } = useToast();
  const { searchTerm } = useSearch();
  const [dataVersion, setDataVersion] = useState(0);

  const triggerDataRefresh = () => {
    setDataVersion(prev => prev + 1);
    reloadCategories();
    reloadProducts();
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
    return categoryList
      .filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [categoryList, searchTerm, dataVersion]);
  
  const getProductCount = (categoryId: string) => {
    return products.filter(p => p.categoryId === categoryId).length;
  };

  if (selectedCategory) {
    const categoryToEdit = selectedCategory === 'new' ? undefined : selectedCategory;
    return <CategoryForm category={categoryToEdit} onBack={handleBackToList} onDataChange={triggerDataRefresh} />;
  }


  return (
    <Card className="animate-fade-in-up">
      <CardHeader>
        <div className='flex justify-between items-center gap-4'>
            <div>
                <CardTitle>دسته‌بندی‌ها</CardTitle>
                <CardDescription>
                دسته‌بندی‌ها و فروشگاه‌های خود را مدیریت کنید.
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
              <TableHead>فروشگاه</TableHead>
              <TableHead className="text-left">محصولات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredCategories.map((category) => (
              <TableRow 
                key={category.id} 
                onClick={() => handleEdit(category)}
                className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-1"
              >
                <TableCell className="font-medium">
                  {category.name}
                </TableCell>
                <TableCell>{category.storeName || '-'}</TableCell>
                <TableCell className="text-left">
                  {getProductCount(category.id)}
                </TableCell>
              </TableRow>
            ))}
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
