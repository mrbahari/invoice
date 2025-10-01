
'use client';

import { PlusCircle, Pencil, Eye, Trash2, CheckCircle2, TriangleAlert, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { Invoice, InvoiceStatus } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
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
import Draggable from 'react-draggable';


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
  const { data, setData } = useData();
  const { customers, invoices: allInvoices, toolbarPosition } = data;
  const { toast } = useToast();
  const { searchTerm, setSearchVisible } = useSearch();
  const draggableToolbarRef = useRef(null);
  
  const [view, setView] = useState<View>({ type: 'list' });

  useEffect(() => {
    if (view.type === 'list') {
      setSearchVisible(true);
    } else {
      setSearchVisible(false);
    }
  }, [view, setSearchVisible]);

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
      setData((prev) => ({
        ...prev,
        invoices: prev.invoices.filter((inv) => inv.id !== invoiceId),
      }));
      toast({ variant: 'success', title: 'فاکتور حذف شد' });
      setView({ type: 'list' });
    },
    [setData, toast]
  );

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
    return allInvoices.filter(
      (invoice) =>
        invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allInvoices, searchTerm]);

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
               <Draggable
                handle=".drag-handle"
                position={toolbarPosition}
                nodeRef={draggableToolbarRef}
                onStop={(e, dragData) => {
                    setData(prev => ({...prev, toolbarPosition: { x: dragData.x, y: dragData.y }}));
                }}
            >
                <div 
                    ref={draggableToolbarRef} 
                    style={{ position: 'fixed', zIndex: 40 }}
                >
                    <div className="flex items-center gap-2 p-2 bg-card/90 border rounded-lg shadow-lg backdrop-blur-sm">
                        <div className="drag-handle cursor-move p-2 -ml-2 -my-2 rounded-l-md hover:bg-muted">
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    className="h-12 w-12 bg-green-600 hover:bg-green-700 text-white dark:bg-white dark:text-black"
                                    onClick={handleCreate}
                                >
                                    <PlusCircle className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>افزودن فاکتور</p></TooltipContent>
                        </Tooltip>
                    </div>
                </div>
              </Draggable>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>فاکتورها</CardTitle>
                      <CardDescription>فاکتورهای اخیر فروشگاه شما.</CardDescription>
                    </div>
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
                        <CardHeader className="pb-4">
                          <div className="flex justify-between items-start">
                            <div className="grid gap-1">
                              <CardTitle className="text-lg">{displayName}</CardTitle>
                              <CardDescription className="text-sm text-muted-foreground">{displayPhone}</CardDescription>
                            </div>
                           
                          </div>
                        </CardHeader>
                        <CardContent className="grid gap-2 text-sm">
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
                        <CardFooter className="flex flex-row items-center justify-between pt-4">
                            <Badge variant="outline" className={cn("text-xs font-mono", statusStyles[invoice.status])}>
                              {statusTranslation[invoice.status]}
                            </Badge>

                           <div className="flex items-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(invoice)}>
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>ویرایش</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePreview(invoice)}>
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>پیش‌نمایش</p></TooltipContent>
                                </Tooltip>
                                 <AlertDialog>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
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
                                        <AlertDialogFooter className="grid grid-cols-2 gap-2">
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
