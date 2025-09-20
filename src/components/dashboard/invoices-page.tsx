'use client';

import { PlusCircle, Edit, Eye, Trash2, CheckCircle2, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvoiceTabs } from '@/components/dashboard/invoice-tabs';
import { useState, useMemo, useEffect, useCallback } from 'react';
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
  const { customers, invoices: allInvoices } = data;
  const { toast } = useToast();
  const { searchTerm, setSearchVisible } = useSearch();

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
  const handlePreviewFromList = useCallback(
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
          <InvoiceEditor
            invoiceId={view.invoiceId}
            initialUnsavedInvoice={view.initialUnsavedInvoice}
            onSaveSuccess={handleSaveSuccess}
            onPreview={handlePreviewFromEditor}
            onCancel={handleCancel}
          />
        );
      case 'preview':
        return (
          <InvoicePreviewPage
            invoiceId={view.invoiceId}
            onBack={() => handleBackFromPreview(view.invoiceId)}
            onEdit={(id) => handleEdit({ id } as Invoice)}
          />
        );
      case 'list':
      default:
        return (
           <div className="grid gap-6">
              <Card className="animate-fade-in-up">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>فاکتورها</CardTitle>
                      <CardDescription>فاکتورهای اخیر فروشگاه شما.</CardDescription>
                    </div>
                    <Button
                      size="sm"
                      className="h-8 gap-1 dark:bg-white dark:text-black"
                      onClick={handleCreate}
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        ایجاد فاکتور
                      </span>
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {filteredInvoices.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredInvoices.map((invoice, index) => {
                    const StatusIcon = statusIcons[invoice.status];
                    const customer = customers.find(c => c.id === invoice.customerId);
                    const hasValidName = customer && customer.name && customer.name !== 'مشتری بدون نام';
                    const displayName = hasValidName ? customer!.name : (invoice.customerName && invoice.customerName !== 'مشتری بدون نام' ? invoice.customerName : 'بی نام');
                    const displayPhone = customer?.phone || 'بدون تماس';

                    return (
                      <Card 
                        key={invoice.id} 
                        className="flex flex-col justify-between transition-all hover:shadow-lg animate-fade-in-up"
                        style={{ animationDelay: `${index * 50}ms`}}
                        onClick={() => handleEdit(invoice)}
                      >
                        <CardHeader className="pb-4">
                          <div className="flex justify-between items-start">
                            <div className="grid gap-1">
                              <CardTitle className="text-lg">{displayName}</CardTitle>
                              <CardDescription>{displayPhone}</CardDescription>
                            </div>
                            <Badge variant="outline" className={cn("text-xs font-mono", statusStyles[invoice.status])}>
                              {statusTranslation[invoice.status]}
                            </Badge>
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
                        <CardFooter className="flex justify-end gap-2 pt-4">
                          <Button onClick={(e) => { e.stopPropagation(); handlePreview(invoice); }} size="sm" variant="outline">
                            <Eye className="ml-2 h-4 w-4" />
                            مشاهده
                          </Button>
                           <Button onClick={(e) => { e.stopPropagation(); handleEdit(invoice); }} size="sm">
                             <Edit className="ml-2 h-4 w-4" />
                            ویرایش
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
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
        );
    }
  };

  return renderContent();
}
