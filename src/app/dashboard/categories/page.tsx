
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
import { categories, products } from '@/lib/data';

export default function CategoriesPage() {
  const getProductCount = (categoryId: string) => {
    return products.filter(p => p.categoryId === categoryId).length;
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
            <Button size="sm" className="h-8 gap-1">
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
              <TableHead>نام فروشگاه</TableHead>
              <TableHead className="hidden sm:table-cell">اطلاعات تماس</TableHead>
              <TableHead className="text-left">محصولات</TableHead>
              <TableHead>
                <span className="sr-only">اقدامات</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">باز کردن منو</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>اقدامات</DropdownMenuLabel>
                      <DropdownMenuItem>ویرایش</DropdownMenuItem>
                      <DropdownMenuItem>حذف</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
       <CardFooter>
        <div className="text-xs text-muted-foreground">
          نمایش <strong>1-{categories.length}</strong> از <strong>{categories.length}</strong> دسته‌بندی
        </div>
      </CardFooter>
    </Card>
  );
}
