
'use client';

import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvoiceTabs } from '@/components/dashboard/invoice-tabs';
import { useState, useMemo, useEffect } from 'react';
import type { Invoice, InvoiceStatus } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { useSearch } from '@/components/dashboard/search-provider';
import { InvoiceEditor } from './invoice-editor';
import InvoicePreviewPage from './invoice-preview-page';
import { useData } from '@/context/data-context';

type View = 
    | { type: 'list' }
    | { type: 'editor'; invoiceId?: string }
    | { type: 'preview'; invoiceId: string; from: 'list' | 'editor' };
    
type InvoicesPageProps = {
  initialInvoice?: Omit<Invoice, 'id'>;
};


export default function InvoicesPage({ initialInvoice: initialInvoiceProp }: InvoicesPageProps) {
  const { data, setData } = useData();
  const { invoices: allInvoices, customers } = data;
  const { toast } = useToast();
  const { searchTerm } = useSearch();

  const [view, setView] = useState<View>({ type: 'list' });
  const [initialInvoice, setInitialInvoice] = useState(initialInvoiceProp);

  useEffect(() => {
    if (initialInvoice) {
      setView({ type: 'editor', invoiceId: undefined });
    }
  }, [initialInvoice]);

  
  const handleBackToList = () => {
    setView({ type: 'list' });
    setInitialInvoice(undefined); // Clear initial invoice when going back to list
  };

  const handleSaveAndPreview = (invoiceId: string) => {
    setView({ type: 'preview', invoiceId, from: 'editor' });
  };
  
  const handlePreviewFromList = (invoiceId: string) => {
    setView({ type: 'preview', invoiceId, from: 'list' });
  };
  
  const handleEdit = (invoiceId: string) => {
    setView({ type: 'editor', invoiceId });
  };

  const handleUpdateStatus = (invoiceId: string, status: InvoiceStatus) => {
    setData({
      ...data,
      invoices: data.invoices.map(inv =>
        inv.id === invoiceId ? { ...inv, status } : inv
      ),
    });
    toast({
      variant: 'success',
      title: 'وضعیت فاکتور به‌روزرسانی شد',
    });
  };
  
  const filteredInvoices = useMemo(() => {
    if (!allInvoices) return [];
    return allInvoices.filter(invoice =>
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allInvoices, searchTerm]);

  const paidInvoices = useMemo(() => filteredInvoices.filter(inv => inv.status === 'Paid'), [filteredInvoices]);
  const pendingInvoices = useMemo(() => filteredInvoices.filter(inv => inv.status === 'Pending'), [filteredInvoices]);
  const overdueInvoices = useMemo(() => filteredInvoices.filter(inv => inv.status === 'Overdue'), [filteredInvoices]);

  const tabsData = useMemo(() => [
    { value: 'all', label: `همه (${filteredInvoices.length})`, invoices: filteredInvoices },
    { value: 'paid', label: `پرداخت شده (${paidInvoices.length})`, invoices: paidInvoices },
    { value: 'pending', label: `در انتظار (${pendingInvoices.length})`, invoices: pendingInvoices },
    { value: 'overdue', label: `سررسید گذشته (${overdueInvoices.length})`, invoices: overdueInvoices, className: 'hidden sm:flex' },
  ], [filteredInvoices, paidInvoices, pendingInvoices, overdueInvoices]);

  const renderContent = () => {
    switch (view.type) {
      case 'editor':
        return (
          <InvoiceEditor
            invoiceId={view.invoiceId}
            initialData={view.invoiceId ? undefined : initialInvoice}
            onSave={handleBackToList}
            onCancel={handleBackToList}
            onSaveAndPreview={handleSaveAndPreview}
          />
        );
      case 'preview':
        const onBack = view.from === 'editor' && view.invoiceId 
            ? () => setView({ type: 'editor', invoiceId: view.invoiceId })
            : handleBackToList;
        return <InvoicePreviewPage invoiceId={view.invoiceId} onBack={onBack} />;
      case 'list':
      default:
        return (
          <InvoiceTabs
            tabs={tabsData}
            customers={customers || []}
            defaultTab="all"
            onStatusChange={handleUpdateStatus}
            onEditInvoice={handleEdit}
            onPreviewInvoice={handlePreviewFromList}
            pageActions={
              <Button size="sm" className="h-8 gap-1" onClick={() => setView({ type: 'editor' })}>
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  ایجاد فاکتور
                </span>
              </Button>
            }
          />
        );
    }
  };

  return renderContent();
}
