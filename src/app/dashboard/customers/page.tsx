
'use client';

import { MoreHorizontal, PlusCircle, File } from 'lucide-react';
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
import { initialCustomers, initialInvoices } from '@/lib/data';
import { formatCurrency, downloadCSV } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Customer, Invoice } from '@/lib/definitions';
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

export default function CustomersPage() {
  const [customerList, setCustomerList] = useLocalStorage<Customer[]>('customers', initialCustomers);
  const [invoices] = useLocalStorage<Invoice[]>('invoices', initialInvoices);
  const { toast } = useToast();

  const getCustomerStats = (customerId: string) => {
    const customerInvoices = invoices.filter(inv => inv.customerId === customerId);
    const totalSpent = customerInvoices.reduce((acc, inv) => acc + inv.total, 0);
    const orderCount = customerInvoices.length;
    return { totalSpent, orderCount };
  };

  const handleExport = () => {
    const headers = {
        name: 'نام',
        email: 'ایمیل',
        phone: 'تلفن',
        address: 'آدرس'
    };
    downloadCSV(customerList, 'customers.csv', headers);
  };
  
  const handleDeleteCustomer = (customerId: string) => {
    const customerToDelete = customerList.find(c => c.id === customerId);
    setCustomerList(prev => prev.filter(c => c.id !== customerId));
    toast({
        title: 'مشتری حذف شد',
        description: `مشتری "${customerToDelete?.name}" با موفقیت حذف شد.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
            <div>
                <CardTitle>مشتریان</CardTitle>
                <CardDescription>
                مشتریان خود را مدیریت کرده و سابقه خرید آنها را مشاهده کنید.
                </CardDescription>
            </div>
            <div className="mr-auto flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleExport}>
                    <File className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        خروجی
                    </span>
                </Button>
                <Link href="/dashboard/customers/new">
                  <Button size="sm" className="h-8 gap-1">
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      افزودن مشتری
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
              <TableHead>مشتری</TableHead>
              <TableHead className="hidden sm:table-cell">تماس</TableHead>
              <TableHead className="hidden sm:table-cell text-center">سفارش‌ها</TableHead>
              <TableHead className="hidden md:table-cell text-left">مجموع خرج شده</TableHead>
              <TableHead>
                <span className="sr-only">اقدامات</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customerList.map((customer) => {
              const { totalSpent, orderCount } = getCustomerStats(customer.id);
              const nameInitials = customer.name.split(' ').map(n => n[0]).join('');
              return (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="hidden h-9 w-9 sm:flex">
                        <AvatarImage src={`https://picsum.photos/seed/${customer.id}/36/36`} alt="آواتار" data-ai-hint="person avatar" />
                        <AvatarFallback>{nameInitials}</AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{customer.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div>{customer.email}</div>
                    <div className="text-xs text-muted-foreground">{customer.phone}</div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-center">
                    {orderCount}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-left">
                    {formatCurrency(totalSpent)}
                  </TableCell>
                  <TableCell>
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
                            <Link href={`/dashboard/customers/${customer.id}/edit`}>ویرایش</Link>
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
                              این عمل غیرقابل بازگشت است و مشتری «{customer.name}» را برای همیشه حذف می‌کند.
                          </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                          <AlertDialogCancel>انصراف</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteCustomer(customer.id)} className='bg-destructive hover:bg-destructive/90'>حذف</AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          نمایش <strong>1-{customerList.length}</strong> از <strong>{customerList.length}</strong> مشتریان
        </div>
      </CardFooter>
    </Card>
  );
}
