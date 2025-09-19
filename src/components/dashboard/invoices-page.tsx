
'use client';

import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvoiceTabs } from '@/components/dashboard/invoice-tabs';
import { useState, useMemo, useEffect } from 'react';
import type { Invoice, InvoiceStatus, Customer } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { useSearch } from '@/components/dashboard/search-provider';
import { InvoiceEditor } from './invoice-editor';
import InvoicePreviewPage from './invoice-preview-page';
import { useCollection } from '@/hooks/use-collection';

type View = 
    | { type: 'list' }
    | { type: 'form'; invoice?: Invoice }
    | { type: 'preview'; invoiceId: string };

type InvoicesPageProps = {
  initialInvoice?: Invoice;
};

export default function InvoicesPage({ initialInvoice }: InvoicesPageProps) {
  const { data: allInvoices, update: updateInvoice, remove: removeInvoice, loading: invoicesLoading } = useCollection<Invoice>('invoices');
  const { data: customers, loading: customersLoading } = useCollection<Customer>('customers');
  const { toast } = useToast();
  const { searchTerm } = useSearch();

  const [view, setView] = useState<View>({ type: 'list' });

  useEffect(() => {
    if (initialInvoice) {
      setView({ type: 'form', invoice: initialInvoice });
    }
  }, [initialInvoice]);

  const handleAddClick = () => setView({ type: 'form' });
  const handleEditClick = (invoice: Invoice) => setView({ type: 'form', invoice });
  const handlePreviewClick = (invoiceId: string) => setView({ type: 'preview', invoiceId });

  const handleFormCancel = () => {
    setView({ type: 'list' });
  };
  
  const handleFormSaveAndPreview = (invoiceId: string) => {
      setView({ type: 'preview', invoiceId });
  };
  
  const handleUpdateStatus = async (invoiceId: string, status: InvoiceStatus) => {
    await updateInvoice(invoiceId, { status });
    toast({
      title: 'وضعیت فاکتور به‌روزرسانی شد',
      description: `فاکتور به وضعیت "${status === 'Paid' ? 'پرداخت شده' : status === 'Pending' ? 'در انتظار' : 'سررسید گذشته'}" تغییر یافت.`,
    });
  };
  
  const handleDeleteInvoice = async (invoiceId: string) => {
    const invoiceToDelete = allInvoices.find(inv => inv.id === invoiceId);
    await removeInvoice(invoiceId);
    toast({
      title: 'فاکتور حذف شد',
      description: `فاکتور شماره "${invoiceToDelete?.invoiceNumber}" با موفقیت حذف شد.`,
    });
    setView({ type: 'list' });
  };
  
  const filteredInvoices = useMemo(() => {
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
  
  if (view.type === 'form') {
      return <InvoiceEditor invoice={view.invoice} onCancel={handleFormCancel} onSaveAndPreview={handleFormSaveAndPreview} />;
  }

  if (view.type === 'preview') {
      return <InvoicePreviewPage invoiceId={view.invoiceId} onBack={handleFormCancel} />;
  }
  
  if (invoicesLoading || customersLoading) {
      return <div>در حال بارگذاری فاکتورها...</div>
  }

  return (
    <InvoiceTabs
        tabs={tabsData}
        customers={customers}
        defaultTab="all"
        onStatusChange={handleUpdateStatus}
        onDeleteInvoice={handleDeleteInvoice}
        onEditInvoice={handleEditClick}
        onPreviewInvoice={handlePreviewClick}
        pageActions={
            <Button size="sm" className="h-8 gap-1" onClick={handleAddClick}>
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    ایجاد فاکتور
                </span>
            </Button>
        }
    />
  );
}
