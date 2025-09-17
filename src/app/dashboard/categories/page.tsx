
'use client';

import Link from 'next/link';
import { PlusCircle, FilePen, Trash2, Search } from 'lucide-react';
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
import { initialCategories, initialProducts } from '@/lib/data';
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function CategoriesPage() {
  const [categoryList, setCategoryList] = useLocalStorage<Category[]>('categories', initialCategories);
  const [products] = useLocalStorage<Product[]>('products', initialProducts);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const getCategoryName = (categoryId: string) => {
    return categoryList.find(c => c.id === categoryId)?.name;
  };

  const sortedAndFilteredCategories = useMemo(() => {
    const filtered = categoryList.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const categoriesById = new Map(categoryList.map(c => [c.id, c]));
    const topLevelCategories = filtered.filter(c => !c.parentId || !categoriesById.has(c.parentId));
    const childCategories = filtered.filter(c => c.parentId && categoriesById.has(c.parentId));

    const sorted: Category[] = [];
    
    topLevelCategories.sort((a, b) => a.name.localeCompare(b.name)).forEach(parent => {
      sorted.push(parent);
      childCategories
        .filter(child => child.parentId === parent.id)
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(child => sorted.push(child));
    });
    
    // Add orphan children (whose parents are filtered out)
    const addedIds = new Set(sorted.map(c => c.id));
    childCategories.forEach(child => {
        if (!addedIds.has(child.id)) {
            sorted.push(child);
        }
    });


    return sorted;
  }, [categoryList, searchTerm]);
  
  const getProductCount = (categoryId: string) => {
    return products.filter(p => p.categoryId === categoryId).length;
  };

  const handleDeleteCategory = (categoryId: string) => {
    const categoryToDelete = categoryList.find(c => c.id === categoryId);
    if (!categoryToDelete) return;

    const childCount = categoryList.filter(c => c.parentId === categoryId).length;
    if (childCount > 0) {
        toast({
            variant: 'destructive',
            title: 'خطا در حذف',
            description: `این دسته‌بندی دارای ${childCount} زیرمجموعه است و قابل حذف نیست. ابتدا زیرمجموعه‌ها را حذف یا جابجا کنید.`,
        });
        return;
    }

    setCategoryList(prev => prev.filter(c => c.id !== categoryId));
    
    toast({
        title: 'دسته‌بندی حذف شد',
        description: `دسته‌بندی "${categoryToDelete?.name}" با موفقیت حذف شد.`,
    });
  };

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
            <div className="relative ml-auto flex-1 md:grow-0">
                <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="جستجوی دسته‌بندی..."
                    className="w-full rounded-lg bg-background pr-8 md:w-[200px] lg:w-[336px]"
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex items-center gap-2">
            <Link href="/dashboard/categories/new">
              <Button size="sm" className="h-8 gap-1">
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  افزودن دسته‌بندی
                  </span>
              </Button>
            </Link>
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
              <TableHead>
                <span className="sr-only">اقدامات</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredCategories.map((category) => (
              <TableRow key={category.id} className={category.parentId ? 'bg-muted/50' : ''}>
                <TableCell className="font-medium">
                  {category.parentId ? <span className='mr-4'>–</span> : ''}
                  {category.name}
                </TableCell>
                <TableCell>
                  {category.parentId ? (
                     <Badge variant="outline">{getCategoryName(category.parentId)}</Badge>
                  ) : (
                    <span className='text-muted-foreground'>-</span>
                  )}
                </TableCell>
                <TableCell>{category.storeName}</TableCell>
                <TableCell className="text-left">
                  {getProductCount(category.id)}
                </TableCell>
                <TableCell className="text-left">
                  <div className="flex items-center gap-2">
                    <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                      <Link href={`/dashboard/categories/${category.id}/edit`}>
                        <FilePen className="h-4 w-4" />
                        <span className="sr-only">ویرایش</span>
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">حذف</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
                          <AlertDialogDescription>
                              این عمل غیرقابل بازگشت است و دسته‌بندی «{category.name}» را برای همیشه حذف می‌کند.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>انصراف</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteCategory(category.id)} className='bg-destructive hover:bg-destructive/90'>حذف</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
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
