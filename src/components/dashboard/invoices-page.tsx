'use client';

import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvoiceTabs } from '@/components/dashboard/invoice-tabs';
import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Invoice } from '@/lib/definitions';
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

type View =
  | { type: 'list' }
  | { type: 'editor'; invoiceId?: string; initialUnsavedInvoice?: Omit<Invoice, 'id'> }
  | { type: 'preview'; invoiceId: string; from: 'list' | 'editor' };

type InvoicesPageProps = {
  initialInvoice: Omit<Invoice, 'id'> | null;
  setInitialInvoice: (invoice: Omit<Invoice, 'id'> | null) => void;
};

export default function InvoicesPage({
  initialInvoice,
  setInitialInvoice,
}: InvoicesPageProps) {
  const { data, setData } = useData();
  const { invoices: allInvoices } = data;
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
        const tabsData = [
          {
            value: 'all',
            label: `همه (${filteredInvoices.length})`,
            invoices: filteredInvoices,
          },
          {
            value: 'paid',
            label: `پرداخت شده`,
            invoices: filteredInvoices.filter((i) => i.status === 'Paid'),
          },
          {
            value: 'pending',
            label: `در انتظار`,
            invoices: filteredInvoices.filter((i) => i.status === 'Pending'),
          },
          {
            value: 'overdue',
            label: `سررسید گذشته`,
            invoices: filteredInvoices.filter((i) => i.status === 'Overdue'),
            className: 'hidden sm:flex',
          },
        ];
        return (
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
            <CardContent>
              <InvoiceTabs
                tabs={tabsData}
                defaultTab="all"
                onEdit={handleEdit}
                onPreview={handlePreviewFromList}
                onDelete={handleDelete}
              />
            </CardContent>
            <CardFooter>
              <div className="text-xs text-muted-foreground">
                نمایش <strong>{filteredInvoices.length}</strong> از{' '}
                <strong>{allInvoices.length}</strong> فاکتور
              </div>
            </CardFooter>
          </Card>
        );
    }
  };

  return renderContent();
}
