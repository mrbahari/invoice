
'use client';

import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { initialInvoices } from '@/lib/data';
import { InvoiceTabs } from '@/components/dashboard/invoice-tabs';
import { useMemo } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Invoice, InvoiceStatus } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';

export default function InvoicesPage() {
  const [allInvoices, setAllInvoices] = useLocalStorage<Invoice[]>('invoices', initialInvoices);
  const { toast } = useToast();

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

  const paidInvoices = useMemo(() => allInvoices.filter(inv => inv.status === 'Paid'), [allInvoices]);
  const pendingInvoices = useMemo(() => allInvoices.filter(inv => inv.status === 'Pending'), [allInvoices]);
  const overdueInvoices = useMemo(() => allInvoices.filter(inv => inv.status === 'Overdue'), [allInvoices]);

  const tabsData = useMemo(() => [
    { value: 'all', label: `همه (${allInvoices.length})`, invoices: allInvoices },
    { value: 'paid', label: `پرداخت شده (${paidInvoices.length})`, invoices: paidInvoices },
    { value: 'pending', label: `در انتظار (${pendingInvoices.length})`, invoices: pendingInvoices },
    { value: 'overdue', label: `سررسید گذشته (${overdueInvoices.length})`, invoices: overdueInvoices, className: 'hidden sm:flex' },
  ], [allInvoices, paidInvoices, pendingInvoices, overdueInvoices]);

  return (
    <InvoiceTabs
        tabs={tabsData}
        defaultTab="all"
        onStatusChange={handleUpdateStatus}
        onDeleteInvoice={handleDeleteInvoice}
        pageActions={
            <Link href="/dashboard/invoices/new">
                <Button size="sm" className="h-8 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    ایجاد فاکتور
                </span>
                </Button>
            </Link>
        }
    />
  );
}
