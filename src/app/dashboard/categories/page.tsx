
'use client';

import Link from 'next/link';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { categories as initialCategories, products } from '@/lib/data';
import { useState } from 'react';
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

export default function CategoriesPage() {
  const [categoryList, setCategoryList] = useState(initialCategories);
  const { toast } = useToast();
  
  const getProductCount = (categoryId: string) => {
    return products.filter(p => p.categoryId === categoryId).length;
  };

  const handleDeleteCategory = (categoryId: string) => {
    // In a real app, you would also make an API call to delete the category
    const categoryToDelete = categoryList.find(c => c.id === categoryId);
    initialCategories.splice(initialCategories.findIndex(c => c.id === categoryId), 1);
    setCategoryList(initialCategories);
    
    toast({
        title: 'دسته‌بندی حذف شد',
        description: `دسته‌بندی "${categoryToDelete?.name}" با موفقیت حذف شد.`,
    });
  };

  return (
    <Card>
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
              <TableHead className="hidden sm:table-cell">اطلاعات تماس</TableHead>
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
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">باز کردن منو</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>اقدامات</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/categories/${category.id}/edit`}>ویرایش</Link>
                          </DropdownMenuItem>
                           <AlertDialogTrigger asChild>
                            <DropdownMenuItem className='text-red-600' onSelect={(e) => e.preventDefault()}>حذف</DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
