
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

type ViewType = 'list' | 'editor' | 'preview';

type InvoicesPageProps = {
  initialInvoice?: Omit<Invoice, 'id'>;
};


export default function InvoicesPage({ initialInvoice: initialInvoiceProp }: InvoicesPageProps) {
  const { data, setData } = useData();
  const { invoices: allInvoices } = data;
  const { toast } = useToast();
  const { searchTerm } = useSearch();

  const [view, setView] = useState<ViewType>('list');
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | undefined>(undefined);
  
  useEffect(() => {
    // If an initial invoice is passed (e.g., from estimators), switch to editor view
    if (initialInvoiceProp) {
        // Here we can't be sure if it's a full invoice object or just partial data.
        // We'll treat it as partial and let the editor handle it.
        setCurrentInvoice(initialInvoiceProp as Invoice);
        setView('editor');
    }
  }, [initialInvoiceProp]);
  
  const handleEdit = (invoiceId: string) => {
    const invoiceToEdit = allInvoices.find(inv => inv.id === invoiceId);
    if (invoiceToEdit) {
      setCurrentInvoice(invoiceToEdit);
      setView('editor');
    }
  };

  const handlePreview = (invoiceId: string) => {
    const invoiceToPreview = allInvoices.find(inv => inv.id === invoiceId);
    if (invoiceToPreview) {
      setCurrentInvoice(invoiceToPreview);
      setView('preview');
    }
  };
  
  const handleDelete = (invoiceId: string) => {
    setData(prev => ({
        ...prev,
        invoices: prev.invoices.filter(inv => inv.id !== invoiceId)
    }));
    toast({ variant: 'success', title: 'فاکتور حذف شد' });
  };
  
  const handleSave = (savedInvoice: Invoice) => {
    // After saving (new or update), go to preview that invoice
    setCurrentInvoice(savedInvoice);
    setView('preview');
  }
  
  const handleCancel = () => {
    setCurrentInvoice(undefined);
    setView('list');
  };

  const filteredInvoices = useMemo(() => {
    return allInvoices.filter(invoice =>
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allInvoices, searchTerm]);
  
  const renderContent = () => {
    switch (view) {
      case 'editor':
        return (
          <InvoiceEditor
            invoice={currentInvoice}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        );
      case 'preview':
        return currentInvoice ? (
          <InvoicePreviewPage invoiceId={currentInvoice.id} onBack={() => setView('editor')} />
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
                     <Button size="sm" className="h-8 gap-1" onClick={() => { setCurrentInvoice(undefined); setView('editor'); }}>
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
