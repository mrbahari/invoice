
'use client';

import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { initialData } from '@/lib/data';
import { InvoiceTabs } from '@/components/dashboard/invoice-tabs';
import { useState, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Invoice, InvoiceStatus, Customer } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { useSearch } from '@/components/dashboard/search-provider';
import { InvoiceEditor } from '@/components/dashboard/invoice-editor';
import InvoicePreviewPage from './[id]/page';

export default function InvoicesPage() {
  const [allInvoices, setAllInvoices] = useLocalStorage<Invoice[]>('invoices', initialData.invoices);
  const [customers] = useLocalStorage<Customer[]>('customers', initialData.customers);
  const { toast } = useToast();
  const { searchTerm } = useSearch();

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | 'new' | null>(null);
  const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);

  const handleUpdateStatus = (invoiceId: string, status: InvoiceStatus) => {
    setAllInvoices(prev => 
      prev.map(inv => 
        inv.id === invoiceId ? { ...inv, status } : inv
      )
    );
    toast({
      title: 'وضعیت فاکتور به‌روزرسانی شد',
      description: `فاکتور به وضعیت "${status === 'Paid' ? 'پرداخت شده' : status}" تغییر یافت.`,
    });
  };
  
  const handleDeleteInvoice = (invoiceId: string) => {
    const invoiceToDelete = allInvoices.find(inv => inv.id === invoiceId);
    setAllInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
    toast({
      title: 'فاکتور حذف شد',
      description: `فاکتور شماره "${invoiceToDelete?.invoiceNumber}" با موفقیت حذف شد.`,
    });
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
  
  const handleAddNew = () => {
    setSelectedInvoice('new');
    setViewingInvoiceId(null);
  };

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setViewingInvoiceId(null);
  };
  
  const handleView = (invoiceId: string) => {
    setViewingInvoiceId(invoiceId);
    setSelectedInvoice(null);
  };
  
  const handleBackToList = () => {
    setSelectedInvoice(null);
    setViewingInvoiceId(null);
  };
  
  const handleSaveAndPreview = (invoiceId: string) => {
    setSelectedInvoice(null);
    setViewingInvoiceId(invoiceId);
  }

  if (viewingInvoiceId) {
    return <InvoicePreviewPage invoiceId={viewingInvoiceId} onBack={handleBackToList} />;
  }

  if (selectedInvoice) {
    const invoiceToEdit = selectedInvoice === 'new' ? undefined : selectedInvoice;
    return <InvoiceEditor invoice={invoiceToEdit} onBack={handleBackToList} onSaveAndPreview={handleSaveAndPreview} />;
  }

  return (
    <InvoiceTabs
        tabs={tabsData}
        customers={customers}
        defaultTab="all"
        onStatusChange={handleUpdateStatus}
        onDeleteInvoice={handleDeleteInvoice}
        onEditInvoice={handleEdit}
        onViewInvoice={handleView}
        pageActions={
            <Button size="sm" className="h-8 gap-1" onClick={handleAddNew}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  ایجاد فاکتور
              </span>
            </Button>
        }
    />
  );
}
