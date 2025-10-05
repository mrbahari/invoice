
'use client';

import { PlusCircle, Pencil, Eye, Trash2, CheckCircle2, TriangleAlert, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { Invoice, InvoiceStatus } from '@/lib/definitions';
import { useSearch } from '@/components/dashboard/search-provider';
import { InvoiceEditor } from './invoice-editor';
import InvoicePreviewPage from './invoice-preview-page';
import { useData } from '@/context/data-context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '../ui/badge';
import { formatCurrency, cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FloatingToolbar } from './floating-toolbar';


type View =
  | { type: 'list' }
  | { type: 'editor'; invoiceId?: string; initialUnsavedInvoice?: Omit<Invoice, 'id'> }
  | { type: 'preview'; invoiceId: string; from: 'list' | 'editor' };

type InvoicesPageProps = {
  initialInvoice: Omit<Invoice, 'id'> | null;
  setInitialInvoice: (invoice: Omit<Invoice, 'id'> | null) => void;
};

const statusStyles: Record<InvoiceStatus, string> = {
  Paid: 'text-green-600 border-green-600/50 bg-green-500/10',
  Pending: 'text-orange-600 border-orange-500/50 bg-orange-500/10',
  Overdue: 'text-red-600 border-red-500/50 bg-red-500/10',
};
const statusTranslation: Record<InvoiceStatus, string> = {
  Paid: 'پرداخت شده',
  Pending: 'در انتظار',
  Overdue: 'سررسید گذشته',
};
const statusIcons: Record<InvoiceStatus, React.ElementType> = {
  Paid: CheckCircle2,
  Pending: TriangleAlert,
  Overdue: TriangleAlert,
};

export default function InvoicesPage({
  initialInvoice,
  setInitialInvoice,
}: InvoicesPageProps) {
  const { data, updateDocument, deleteDocument } = useData();
  const { customers, invoices: allInvoices } = data;
  const { searchTerm, setSearchVisible } = useSearch();

  
  const [view, setView] = useState<View>({ type: 'list' });

  useEffect(() => {
    // Invoices page (list or editor) should not show the main search bar
    setSearchVisible(view.type === 'list');
    // Restore visibility when component unmounts
    return () => setSearchVisible(true);
  }, [view.type, setSearchVisible]);


  // Effect to handle the initial invoice prop from estimators or other pages
  useEffect(() => {
    if (initialInvoice) {
      setView({ type: 'editor', initialUnsavedInvoice: initialInvoice });
      // Clear it after use so it doesn't trigger again on re-renders
      setInitialInvoice(null);
    }
  }, [initialInvoice, setInitialInvoice]);

  const handleCreate = useCallback(() => setView({ type: 'editor' }), []);
  const handleEdit = useCallback(
    (invoice: Invoice) => setView({ type: 'editor', invoiceId: invoice.id }),
    []
  );
  const handlePreview = useCallback(
    (invoice: Invoice) =>
      setView({ type: 'preview', invoiceId: invoice.id, from: 'list' }),
    []
  );
  const handlePreviewFromEditor = useCallback(
    (invoiceId: string) =>
      setView({ type: 'preview', invoiceId, from: 'editor' }),
    []
  );

  const handleBackFromPreview = useCallback(
    (invoiceId?: string) => {
      if (view.type === 'preview' && view.from === 'editor' && invoiceId) {
        setView({ type: 'editor', invoiceId: invoiceId });
      } else {
        setView({ type: 'list' });
      }
    },
    [view]
  );

  const handleDelete = useCallback(
    (invoiceId: string) => {
      deleteDocument('invoices', invoiceId);
      setView({ type: 'list' });
    },
    [deleteDocument]
  );
  
  const handleStatusChange = (invoiceId: string, currentStatus: InvoiceStatus) => {
    const newStatus = currentStatus === 'Paid' ? 'Pending' : 'Paid';
    updateDocument('invoices', invoiceId, { status: newStatus });
  };

  const handleSaveSuccess = useCallback(() => {
    setView({ type: 'list' });
    if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const handleCancel = useCallback(() => {
    setView({ type: 'list' });
  }, []);

  const filteredInvoices = useMemo(() => {
    if (!allInvoices) return [];
    if (!searchTerm) return allInvoices;
  
    const lowercasedTerm = searchTerm.toLowerCase();
  
    return allInvoices.filter((invoice) => {
      const customer = customers.find(c => c.id === invoice.customerId);
      const customerPhone = customer?.phone || '';
  
      return (
        invoice.customerName.toLowerCase().includes(lowercasedTerm) ||
        invoice.invoiceNumber.toLowerCase().includes(lowercasedTerm) ||
        customerPhone.toLowerCase().includes(lowercasedTerm)
      );
    });
  }, [allInvoices, searchTerm, customers]);

  const renderContent = () => {
    switch (view.type) {
      case 'editor':
        return (
          <div className="pb-16">
            <InvoiceEditor
              invoiceId={view.invoiceId}
              initialUnsavedInvoice={view.initialUnsavedInvoice}
              onSaveSuccess={handleSaveSuccess}
              onPreview={handlePreviewFromEditor}
              onCancel={handleCancel}
            />
          </div>
        );
      case 'preview':
        return (
          <InvoicePreviewPage
            invoiceId={view.invoiceId}
            onBack={() => handleBackFromPreview(view.invoiceId)}
            onEdit={(id) => setView({ type: 'editor', invoiceId: id })}
          />
        );
      case 'list':
      default:
        return (
          <TooltipProvider>
           <div className="grid gap-6 pb-24" data-main-page="true">
                <FloatingToolbar pageKey="invoices-list">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                            size="icon"
                            className="h-10 w-10 bg-green-600 hover:bg-green-700 text-white dark:bg-white dark:text-black"
                            onClick={handleCreate}
                            >
                            <PlusCircle className="h-5 w-5" />
                            <span className="sr-only">افزودن فاکتور</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left"><p>افزودن فاکتور</p></TooltipContent>
                    </Tooltip>
                </FloatingToolbar>
              <Card>
                <CardHeader>
                    <div>
                      <CardTitle>فاکتورها</CardTitle>
                      <CardDescription>فاکتورهای اخیر فروشگاه شما.</CardDescription>
                    </div>
                </CardHeader>
              </Card>

              {filteredInvoices.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredInvoices.map((invoice) => {
                    const customer = customers.find(c => c.id === invoice.customerId);
                    const hasValidName = customer && customer.name && customer.name !== 'مشتری بدون نام';
                    const displayName = hasValidName ? customer!.name : (invoice.customerName && invoice.customerName !== 'مشتری بدون نام' ? invoice.customerName : 'بی نام');
                    const displayPhone = customer?.phone || 'بدون تماس';

                    return (
                      <Card 
                        key={invoice.id} 
                        className="flex flex-col justify-between"
                      >
                        <CardHeader className="p-4 sm:p-6 pb-4">
                          <div className="flex justify-between items-start">
                            <div className="grid gap-1">
                              <CardTitle className="text-base sm:text-lg">{displayPhone}</CardTitle>
                              <CardDescription className="text-sm text-muted-foreground">{displayName}</CardDescription>
                            </div>
                           
                          </div>
                        </CardHeader>
                        <CardContent className="grid gap-2 text-sm p-4 sm:p-6 pt-0">
                           <div className="flex justify-between">
                            <span className="text-muted-foreground">شماره فاکتور</span>
                            <span>{invoice.invoiceNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">تاریخ</span>
                            <span>{new Date(invoice.date).toLocaleDateString('fa-IR')}</span>
                          </div>
                          <div className="flex justify-between font-semibold text-base pt-2 border-t mt-2">
                            <span className="text-muted-foreground">مبلغ کل</span>
                            <span>{formatCurrency(invoice.total)}</span>
                          </div>
                        </CardContent>
                        <CardFooter className="flex flex-row items-center justify-between p-4 sm:p-6">
                            <button onClick={() => handleStatusChange(invoice.id, invoice.status)}>
                                <Badge variant="outline" className={cn("text-xs font-mono cursor-pointer", statusStyles[invoice.status])}>
                                {statusTranslation[invoice.status]}
                                </Badge>
                            </button>

                           <div className="flex items-center gap-0 sm:gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon-sm" className="h-8 w-8" onClick={() => handleEdit(invoice)}>
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>ویرایش</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon-sm" className="h-8 w-8" onClick={() => handlePreview(invoice)}>
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>پیش‌نمایش</p></TooltipContent>
                                </Tooltip>
                                 <AlertDialog>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-destructive hover:text-destructive">
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent><p>حذف</p></TooltipContent>
                                    </Tooltip>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                این عمل غیرقابل بازگشت است و فاکتور شماره {invoice.invoiceNumber} را برای همیشه حذف می‌کند.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>انصراف</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => handleDelete(invoice.id)}
                                                className="bg-destructive hover:bg-destructive/90"
                                            >
                                                حذف
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-16 text-center">
                    <p className="text-muted-foreground mb-4">
                      {searchTerm ? `هیچ فاکتوری با عبارت «${searchTerm}» یافت نشد.` : 'هیچ فاکتوری ایجاد نشده است.'}
                    </p>
                     <Button variant="link" onClick={handleCreate}>
                      یک فاکتور جدید ایجاد کنید
                    </Button>
                  </CardContent>
                </Card>
              )}
          </div>
          </TooltipProvider>
        );
    }
  };

  return renderContent();
}
