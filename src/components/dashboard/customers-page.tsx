'use client';

import { File, PlusCircle, Trash2, Loader2, Move, SortAsc, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
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
import { downloadCSV } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Customer, Invoice } from '@/lib/definitions';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useSearch } from '@/components/dashboard/search-provider';
import { CustomerForm } from './customer-form';
import { CustomerDetailPage } from './customer-detail-page';
import { useData } from '@/context/data-context';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
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
} from '../ui/alert-dialog';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';


type View =
  | { type: 'list' }
  | { type: 'form'; customer?: Customer }
  | { type: 'detail'; customer: Customer };

type SortOption = 'name' | 'newest' | 'invoiceCount';

const animationProps = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: 'easeInOut' },
};

type CustomersPageProps = {
  initialCustomer?: Customer;
};

export default function CustomersPage({ initialCustomer }: CustomersPageProps) {
  const { data, deleteDocuments } = useData();
  const { customers: customerList, invoices } = data;
  const { user } = useUser();
  const { toast } = useToast();
  const { searchTerm, setSearchVisible } = useSearch();
  const [view, setView] = useState<View>(initialCustomer ? { type: 'detail', customer: initialCustomer } : { type: 'list' });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>(initialCustomer);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('newest');


  useEffect(() => {
    // Control search bar visibility based on view
    if (view.type === 'list') {
      setSearchVisible(true);
    } else {
      setSearchVisible(false);
    }
  }, [view, setSearchVisible]);
  
  useEffect(() => {
    setSelectedCustomers([]);
  }, [searchTerm, sortOption]);

  const handleAddClick = () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'ورود لازم است',
        description: 'برای افزودن مشتری، لطفاً ابتدا وارد حساب خود شوید.',
      });
      return;
    }
    setSelectedCustomer(undefined);
    setView({ type: 'form' });
  };

  const handleDetailClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setView({ type: 'detail', customer });
  };
  
  const handleEditClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setView({ type: 'form', customer });
  }
  
  const handleSelectCustomer = (customerId: string, checked: boolean) => {
    setSelectedCustomers(prev => 
      checked ? [...prev, customerId] : prev.filter(id => id !== customerId)
    );
  };
  
  const handleDeleteSelected = async () => {
    if (selectedCustomers.length === 0) return;
    setIsProcessingBulk(true);
    try {
      // Find invoices associated with selected customers
      const invoicesToDelete = invoices.filter(inv => selectedCustomers.includes(inv.customerId)).map(inv => inv.id);
      
      if (invoicesToDelete.length > 0) {
        await deleteDocuments('invoices', invoicesToDelete);
      }
      await deleteDocuments('customers', selectedCustomers);

      toast({ variant: 'success', title: 'مشتریان با موفقیت حذف شدند.' });
      setSelectedCustomers([]);
    } catch (error) {
      toast({ variant: 'destructive', title: 'خطا در حذف مشتریان' });
    } finally {
      setIsProcessingBulk(false);
    }
  };


  const handleFormSuccess = () => {
    setView({ type: 'list' });
    setSelectedCustomer(undefined);
  };

  const handleBackToList = () => {
    setView({ type: 'list' });
    setSelectedCustomer(undefined);
  };

  const getCustomerInvoiceCount = useCallback((customerId: string) => {
    if (!invoices) return 0;
    return invoices.filter(inv => inv.customerId === customerId).length;
  }, [invoices]);

  const filteredCustomers = useMemo(() => {
    if (!customerList) return [];

    let filtered = customerList.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sorting logic
    switch (sortOption) {
        case 'name':
            filtered.sort((a, b) => a.name.localeCompare(b.name, 'fa'));
            break;
        case 'invoiceCount':
            filtered.sort((a, b) => getCustomerInvoiceCount(b.id) - getCustomerInvoiceCount(a.id));
            break;
        case 'newest':
        default:
            filtered.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });
            break;
    }

    return filtered;
  }, [customerList, searchTerm, sortOption, getCustomerInvoiceCount]);

  const handleExport = () => {
    const headers = {
      name: 'نام',
      email: 'ایمیل',
      phone: 'تلفن',
      address: 'آدرس',
    };
    downloadCSV(filteredCustomers, 'customers.csv', headers);
  };

  const renderContent = () => {
    switch (view.type) {
      case 'form':
        return (
          <motion.div key="form" {...animationProps}>
            <CustomerForm
              customer={selectedCustomer}
              onSave={handleFormSuccess}
              onCancel={handleBackToList}
            />
          </motion.div>
        );
      case 'detail':
        return (
          <motion.div key="detail" {...animationProps}>
            <CustomerDetailPage 
              customer={selectedCustomer!} 
              onBack={handleBackToList}
              onEdit={handleEditClick}
            />
          </motion.div>
        )
      case 'list':
      default:
        return (
          <motion.div key="list" {...animationProps}>
            <div className="grid gap-6 pb-24" data-main-page="true">
              <Card>
                <CardHeader>
                    <div>
                      <CardTitle>مشتریان</CardTitle>
                      <CardDescription>
                        مشتریان خود را مدیریت کرده و سابقه خرید آنها را مشاهده کنید.
                      </CardDescription>
                    </div>
                </CardHeader>
              </Card>

              <div className="flex items-center justify-between gap-4">
                  <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                      <SelectTrigger className="w-[180px] h-9">
                          <div className="flex items-center gap-2">
                              <SortAsc className="h-4 w-4" />
                              <SelectValue placeholder="مرتب‌سازی بر اساس..." />
                          </div>
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="newest">جدیدترین</SelectItem>
                          <SelectItem value="name">نام</SelectItem>
                          <SelectItem value="invoiceCount">تعداد فاکتور</SelectItem>
                      </SelectContent>
                  </Select>
                  <Button
                  size="sm"
                  className="h-9 gap-1 bg-green-600 hover:bg-green-700 text-white dark:bg-white dark:text-black"
                  onClick={handleAddClick}
                  >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      افزودن مشتری
                  </span>
                  </Button>
              </div>


              {selectedCustomers.length > 0 && (
                  <Card className="sticky top-[88px] z-10 animate-in fade-in-50">
                      <CardContent className="p-3">
                          <div className="flex items-center justify-between gap-4">
                              <span className="text-sm text-muted-foreground">
                                  {selectedCustomers.length.toLocaleString('fa-IR')} مورد انتخاب شده
                              </span>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setSelectedCustomers([])}>
                                    <X className="ml-2 h-4 w-4" />
                                    لغو
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm" disabled={isProcessingBulk}>
                                            <Trash2 className="ml-2 h-4 w-4" />
                                            حذف موارد انتخابی
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                این عمل غیرقابل بازگشت است و {selectedCustomers.length.toLocaleString('fa-IR')} مشتری را به همراه تمام فاکتورهایشان برای همیشه حذف می‌کند.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="grid grid-cols-2 gap-2">
                                            <AlertDialogCancel>انصراف</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive hover:bg-destructive/90" disabled={isProcessingBulk}>
                                                {isProcessingBulk && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                                حذف
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                              </div>
                          </div>
                      </CardContent>
                  </Card>
              )}


              {filteredCustomers.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredCustomers.map((customer) => {
                        const hasValidName = customer.name && customer.name !== 'مشتری بدون نام';
                        const nameInitials = (hasValidName ? customer.name : customer.phone).split(' ').map(n => n[0]).join('');
                        const invoiceCount = getCustomerInvoiceCount(customer.id);
                        return (
                          <Card
                            key={customer.id}
                            onClick={() => handleDetailClick(customer)}
                            className={cn(
                              "group cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1",
                              selectedCustomers.includes(customer.id) && "ring-2 ring-primary border-primary"
                            )}
                          >
                           <CardContent className="p-4 flex items-center gap-3 relative">
                              <Avatar className="h-12 w-12 border">
                                  <AvatarImage src={customer.avatarUrl || `https://picsum.photos/seed/${customer.id}/48/48`} />
                                  <AvatarFallback>{nameInitials}</AvatarFallback>
                              </Avatar>
                              <div className="grid gap-0.5 overflow-hidden">
                                  <p className="text-sm font-semibold truncate">{hasValidName ? customer.name : customer.phone}</p>
                                  <p className="text-xs text-muted-foreground truncate">{hasValidName ? customer.phone : ' '}</p>
                              </div>
                               {invoiceCount > 0 && (
                                  <Badge className="absolute -top-2 -right-2 bg-green-600 text-white h-6 w-6 justify-center p-0 rounded-full">
                                    {invoiceCount.toLocaleString('fa-IR')}
                                  </Badge>
                              )}
                              <div className="absolute -top-2 -left-2">
                                <Checkbox
                                    checked={selectedCustomers.includes(customer.id)}
                                    onCheckedChange={(checked) => handleSelectCustomer(customer.id, !!checked)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="h-5 w-5 bg-background/50 backdrop-blur-sm"
                                />
                              </div>
                           </CardContent>
                          </Card>
                        );
                      })}
                </div>
               ) : (
                <Card>
                  <CardContent className="py-16 text-center">
                    <p className="text-muted-foreground mb-4">
                       {searchTerm ? `هیچ مشتری‌ای با عبارت «${searchTerm}» یافت نشد.` : 'هیچ مشتری‌ای یافت نشد.'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        );
    }
  };

  return <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>;
}
