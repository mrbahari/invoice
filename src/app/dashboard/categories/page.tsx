
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

export default function CategoriesPage() {
  const [categoryList, setCategoryList] = useLocalStorage<Category[]>('categories', initialCategories);
  const [products] = useLocalStorage<Product[]>('products', initialProducts);
  const { toast } = useToast();
  
  const getProductCount = (categoryId: string) => {
    return products.filter(p => p.categoryId === categoryId).length;
  };

  const handleDeleteCategory = (categoryId: string) => {
    const categoryToDelete = categoryList.find(c => c.id === categoryId);
    setCategoryList(prev => prev.filter(c => c.id !== categoryId));
    
    toast({
        title: 'دسته‌بندی حذف شد',
        description: `دسته‌بندی "${categoryToDelete?.name}" با موفقیت حذف شد.`,
    });
  };

  return (
    <Card className="animate-fade-in-up">
      <CardHeader>
        <div className='flex justify-between items-center'>
            <div>
                <CardTitle>دسته‌بندی‌ها</CardTitle>
                <CardDescription>
                اطلاعات فروشگاه را برای هر دسته‌بندی مدیریت کنید.
                </CardDescription>
            </div>
            <div className="mr-auto flex items-center gap-2">
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
              <TableHead>نام فروشگاه</TableHead>
              <TableHead className="hidden sm:table-cell">آدرس</TableHead>
              <TableHead className="text-left">محصولات</TableHead>
              <TableHead>
                <span className="sr-only">اقدامات</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categoryList.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>{category.storeName}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div className='text-sm'>{category.storeAddress}</div>
                  <div className='text-xs text-muted-foreground'>{category.storePhone}</div>
                </TableCell>
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
          نمایش <strong>1-{categoryList.length}</strong> از <strong>{categoryList.length}</strong> دسته‌بندی
        </div>
      </CardFooter>
    </Card>
  );
}
