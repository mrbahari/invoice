
'use client';

import { File, PlusCircle } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useSearch } from '@/components/dashboard/search-provider';

export default function CustomersPage() {
  const [customerList, setCustomerList] = useLocalStorage<Customer[]>('customers', initialCustomers);
  const [invoices] = useLocalStorage<Invoice[]>('invoices', initialInvoices);
  const { toast } = useToast();
  const router = useRouter();
  const { searchTerm } = useSearch();

  const filteredCustomers = useMemo(() => {
    return customerList.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customerList, searchTerm]);

  const handleRowClick = (customerId: string) => {
    router.push(`/dashboard/customers/${customerId}/edit`);
  };

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
    downloadCSV(filteredCustomers, 'customers.csv', headers);
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
    <Card className="animate-fade-in-up">
      <CardHeader>
        <div className='flex items-center justify-between gap-4'>
            <div>
                <CardTitle>مشتریان</CardTitle>
                <CardDescription>
                مشتریان خود را مدیریت کرده و سابقه خرید آنها را مشاهده کنید.
                </CardDescription>
            </div>
            <div className="flex items-center gap-2">
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
              <TableHead className="hidden sm:table-cell">شماره تماس</TableHead>
              <TableHead className="hidden sm:table-cell text-center">سفارش‌ها</TableHead>
              <TableHead className="hidden md:table-cell text-left">جمع مبلغ سفارشات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((customer) => {
              const { totalSpent, orderCount } = getCustomerStats(customer.id);
              const nameInitials = customer.name.split(' ').map(n => n[0]).join('');
              return (
                <TableRow 
                  key={customer.id} 
                  onClick={() => handleRowClick(customer.id)} 
                  className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-1"
                >
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
                    <div>{customer.phone}</div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-center">
                    {orderCount}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-left">
                    {formatCurrency(totalSpent)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          نمایش <strong>{filteredCustomers.length}</strong> از <strong>{customerList.length}</strong> مشتریان
        </div>
      </CardFooter>
    </Card>
  );
}
