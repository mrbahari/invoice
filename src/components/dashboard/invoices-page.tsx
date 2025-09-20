
'use client';

import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvoiceTabs } from '@/components/dashboard/invoice-tabs';
import { useState, useMemo, useEffect } from 'react';
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
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type View = 'list' | 'editor' | 'preview';

type InvoicesPageProps = {
  initialInvoice?: Omit<Invoice, 'id'> | null;
  setInitialInvoice: (invoice: Omit<Invoice, 'id'> | null) => void;
};

export default function InvoicesPage({ initialInvoice, setInitialInvoice }: InvoicesPageProps) {
  const { data, setData } = useData();
  const { invoices: allInvoices } = data;
  const { toast } = useToast();
  const { searchTerm } = useSearch();

  const [view, setView] = useState<View>('list');
  const [currentInvoiceId, setCurrentInvoiceId] = useState<string | undefined>(undefined);

  // Effect to handle the initial invoice prop from estimators
  useEffect(() => {
    if (initialInvoice) {
      // It's a new invoice, go directly to editor. We don't set an ID yet.
      setView('editor');
      setCurrentInvoiceId(undefined); 
    }
  }, [initialInvoice]);

  const handleCreate = () => {
    setInitialInvoice(null); // Clear any estimator-passed invoice
    setCurrentInvoiceId(undefined); // No ID for a new invoice
    setView('editor');
  };

  const handleEdit = (invoiceId: string) => {
    setCurrentInvoiceId(invoiceId);
    setView('editor');
  };

  const handlePreview = (invoiceId: string) => {
    setCurrentInvoiceId(invoiceId);
    setView('preview');
  };

  const handleDelete = (invoiceId: string) => {
    setData(prev => ({
      ...prev,
      invoices: prev.invoices.filter(inv => inv.id !== invoiceId)
    }));
    toast({ variant: 'success', title: 'فاکتور حذف شد' });
    // Stay on the list view
    setView('list');
  };

  // Called from editor when saved, then moves to preview
  const handleSaveAndPreview = (savedInvoiceId: string) => {
    setCurrentInvoiceId(savedInvoiceId);
    setView('preview');
  };
  
  // Called when canceling editor or going back from preview/editor
  const handleCancel = () => {
    setInitialInvoice(null); // Always clear the initial invoice on cancel
    setCurrentInvoiceId(undefined);
    setView('list');
  };

  const filteredInvoices = useMemo(() => {
    return allInvoices.filter(invoice =>
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allInvoices, searchTerm]);

  // Determine which invoice to pass to the editor
  // If it's from an estimator, pass it. Otherwise, pass the one being edited.
  const editorInvoice = useMemo(() => {
      if (view === 'editor' && !currentInvoiceId && initialInvoice) {
          return { ...initialInvoice, id: undefined };
      }
      return currentInvoiceId ? allInvoices.find(inv => inv.id === currentInvoiceId) : undefined;
  }, [view, currentInvoiceId, initialInvoice, allInvoices]);


  const renderContent = () => {
    switch (view) {
      case 'editor':
        return (
          <InvoiceEditor
            invoiceId={currentInvoiceId}
            onSaveAndPreview={handleSaveAndPreview}
            onCancel={handleCancel}
          />
        );
      case 'preview':
        return currentInvoiceId ? (
          <InvoicePreviewPage invoiceId={currentInvoiceId} onBack={() => setView(currentInvoiceId ? 'editor' : 'list')} />
        ) : null;
      case 'list':
      default:
        const tabsData = [
          { value: 'all', label: `همه (${filteredInvoices.length})`, invoices: filteredInvoices },
          { value: 'paid', label: `پرداخت شده`, invoices: filteredInvoices.filter(i => i.status === 'Paid')},
          { value: 'pending', label: `در انتظار`, invoices: filteredInvoices.filter(i => i.status === 'Pending')},
          { value: 'overdue', label: `سررسید گذشته`, invoices: filteredInvoices.filter(i => i.status === 'Overdue'), className: 'hidden sm:flex' },
        ];
        return (
           <Card className="animate-fade-in-up">
              <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>فاکتورها</CardTitle>
                        <CardDescription>فاکتورهای اخیر فروشگاه شما.</CardDescription>
                    </div>
                     <Button size="sm" className="h-8 gap-1" onClick={handleCreate}>
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
                    onPreview={handlePreview}
                    onDelete={handleDelete}
                />
              </CardContent>
              <CardFooter>
                 <div className="text-xs text-muted-foreground">
                    نمایش <strong>{filteredInvoices.length}</strong> از <strong>{allInvoices.length}</strong> فاکتور
                </div>
              </CardFooter>
            </Card>
        );
    }
  };

  return renderContent();
}
