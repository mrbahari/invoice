
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

type View = 
  | { type: 'list' }
  | { type: 'editor'; invoice?: Omit<Invoice, 'id'> | Invoice }
  | { type: 'preview'; invoiceId: string };

type InvoicesPageProps = {
  initialInvoice?: Omit<Invoice, 'id'> | null;
  setInitialInvoice: (invoice: Omit<Invoice, 'id'> | null) => void;
};

export default function InvoicesPage({ initialInvoice, setInitialInvoice }: InvoicesPageProps) {
  const { data, setData } = useData();
  const { invoices: allInvoices } = data;
  const { toast } = useToast();
  const { searchTerm } = useSearch();

  const [view, setView] = useState<View>({ type: 'list' });

  // Effect to handle the initial invoice prop from estimators
  useEffect(() => {
    if (initialInvoice) {
      setView({ type: 'editor', invoice: initialInvoice });
      // Clear it after use so it doesn't trigger again on re-renders
      setInitialInvoice(null);
    }
  }, [initialInvoice, setInitialInvoice]);

  const handleCreate = () => {
    setView({ type: 'editor' });
  };

  const handleEdit = (invoice: Invoice) => {
    setView({ type: 'editor', invoice });
  };

  const handlePreview = (invoice: Invoice) => {
    setView({ type: 'preview', invoiceId: invoice.id });
  };

  const handleDelete = (invoiceId: string) => {
    setData(prev => ({
      ...prev,
      invoices: prev.invoices.filter(inv => inv.id !== invoiceId)
    }));
    toast({ variant: 'success', title: 'فاکتور حذف شد' });
    setView({ type: 'list' });
  };

  const handleSaveSuccess = (savedInvoiceId: string) => {
    setView({ type: 'list' });
  };
  
  const handleEditorPreview = (invoiceId: string) => {
    setView({ type: 'preview', invoiceId });
  };
  
  const handleCancel = () => {
    setView({ type: 'list' });
  };
  
  const handlePreviewBack = () => {
    // If the invoice being previewed is the same as the one being edited, go back to editor.
    // Otherwise, go back to list.
    if (view.type === 'preview' && 'invoice' in view && (view.invoice as Invoice)?.id === view.invoiceId) {
        setView({type: 'editor', invoice: view.invoice})
    } else {
        setView({ type: 'list' });
    }
  };


  const filteredInvoices = useMemo(() => {
    return allInvoices.filter(invoice =>
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allInvoices, searchTerm]);


  const renderContent = () => {
    switch (view.type) {
      case 'editor':
        return (
          <InvoiceEditor
            invoiceToEdit={view.invoice}
            onSaveSuccess={handleSaveSuccess}
            onPreview={handleEditorPreview}
            onCancel={handleCancel}
          />
        );
      case 'preview':
        return (
          <InvoicePreviewPage 
            invoiceId={view.invoiceId} 
            onBack={handleCancel} // Always go back to list from preview for simplicity
            onEdit={(id) => setView({type: 'editor', invoice: allInvoices.find(i => i.id === id)})}
          />
        );
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
