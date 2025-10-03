
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
import { formatCurrency, downloadCSV } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Customer } from '@/lib/definitions';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useSearch } from '@/components/dashboard/search-provider';
import { CustomerForm } from './customer-form';
import CustomerDetailPage from './customer-detail-page';
import { useData } from '@/context/data-context'; // Import useData

type View =
  | { type: 'list' }
  | { type: 'form'; customer?: Customer }
  | { type: 'detail'; customerId: string };

export default function CustomersPage() {
  const { data } = useData(); // Use the central data context
  const { customers: customerList, invoices } = data;
  const { searchTerm, setSearchVisible } = useSearch();
  const [view, setView] = useState<View>({ type: 'list' });
  const scrollPositionRef = useRef(0);

  useEffect(() => {
    // Control search bar visibility based on view
    if (view.type === 'list') {
      setSearchVisible(true);
    } else {
      setSearchVisible(false);
    }
  }, [view, setSearchVisible]);

  useEffect(() => {
    if (view.type === 'list' && scrollPositionRef.current > 0) {
      setTimeout(() => {
        window.scrollTo({ top: scrollPositionRef.current, behavior: 'smooth' });
        scrollPositionRef.current = 0; // Reset after restoring
      }, 0);
    }
  }, [view]);

  const handleAddClick = () => {
    setEditingCustomer(undefined);
    setView({ type: 'form' });
  };

  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);

  const handleEditClick = (customer: Customer) => {
    scrollPositionRef.current = window.scrollY;
    setEditingCustomer(customer);
    setView({ type: 'form', customer });
  };

  const handleRowClick = (customer: Customer) => {
    scrollPositionRef.current = window.scrollY;
    setView({ type: 'detail', customerId: customer.id });
  };

  const handleFormSuccess = () => {
    setView({ type: 'list' });
    setEditingCustomer(undefined);
  };

  const handleFormCancel = () => {
    setView({ type: 'list' });
    setEditingCustomer(undefined);
  };

  const filteredCustomers = useMemo(() => {
    if (!customerList) return [];
    return customerList.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customerList, searchTerm]);

  const getCustomerStats = (customerId: string) => {
    if (!invoices) return { totalSpent: 0, orderCount: 0 };
    const customerInvoices = invoices.filter(
      (inv) => inv.customerId === customerId
    );
    const totalSpent = customerInvoices.reduce((acc, inv) => acc + inv.total, 0);
    const orderCount = customerInvoices.length;
    return { totalSpent, orderCount };
  };

  const handleExport = () => {
    const headers = {
      name: 'نام',
      email: 'ایمیل',
      phone: 'تلفن',
      address: 'آدرس',
    };
    downloadCSV(filteredCustomers, 'customers.csv', headers);
  };

  if (view.type === 'form') {
    return (
      <CustomerForm
        customer={editingCustomer}
        onSave={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    );
  }

  if (view.type === 'detail') {
    return (
      <CustomerDetailPage
        customerId={view.customerId}
        onBack={() => setView({ type: 'list' })}
        onEdit={(customer) => handleEditClick(customer)}
        onInvoiceClick={() => {
          /* Not implemented, needs state lift to main dashboard page */
        }}
      />
    );
  }

  return (
    <div data-main-page="true">
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>مشتریان</CardTitle>
            <CardDescription>
              مشتریان خود را مدیریت کرده و سابقه خرید آنها را مشاهده کنید.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1"
              onClick={handleExport}
            >
              <File className="h-3.5 w-4" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                خروجی
              </span>
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1 bg-green-600 hover:bg-green-700 text-white dark:bg-white dark:text-black"
              onClick={handleAddClick}
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                افزودن مشتری
              </span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>مشتری</TableHead>
              <TableHead className="hidden sm:table-cell text-center">
                سفارش‌ها
              </TableHead>
              <TableHead className="hidden md:table-cell text-left">
                جمع مبلغ سفارشات
              </TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => {
                const { totalSpent, orderCount } = getCustomerStats(customer.id);
                const hasValidName =
                  customer.name && customer.name !== 'مشتری بدون نام';
                const nameInitials = (
                  hasValidName ? customer.name : customer.phone
                )
                  .split(' ')
                  .map((n) => n[0])
                  .join('');
                return (
                  <TableRow
                    key={customer.id}
                    onClick={() => handleRowClick(customer)}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="flex h-9 w-9">
                          <AvatarImage
                            src={`https://picsum.photos/seed/${customer.id}/36/36`}
                            alt="آواتار"
                            data-ai-hint="person avatar"
                          />
                          <AvatarFallback>{nameInitials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{customer.phone}</div>
                          <div className="text-sm text-muted-foreground">
                            {hasValidName ? customer.name : 'بی نام'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-center">
                      {orderCount}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-left">
                      {formatCurrency(totalSpent)}
                    </TableCell>
                    <TableCell className="text-left">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(customer);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        ویرایش
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  هیچ مشتری‌ای یافت نشد.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          نمایش <strong>{filteredCustomers.length}</strong> از{' '}
          <strong>{customerList?.length || 0}</strong> مشتریان
        </div>
      </CardFooter>
    </Card>
    </div>
  );
}
