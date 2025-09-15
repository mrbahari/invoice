
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { invoices } from '@/lib/data';
import { InvoiceTabs } from '@/components/dashboard/invoice-tabs';
import { InvoiceTable } from '@/components/dashboard/invoice-table';

export default function InvoicesPage() {
  const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
  const pendingInvoices = invoices.filter(inv => inv.status === 'Pending');
  const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue');
  const allInvoices = invoices;

  const tabsData = [
    { value: 'all', label: 'همه', invoices: allInvoices },
    { value: 'paid', label: 'پرداخت شده', invoices: paidInvoices },
    { value: 'pending', label: 'در انتظار', invoices: pendingInvoices },
    { value: 'overdue', label: 'سررسید گذشته', invoices: overdueInvoices, className: 'hidden sm:flex' },
  ];

  return (
    <InvoiceTabs
        tabs={tabsData}
        defaultTab="all"
        tableComponent={<InvoiceTable />}
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
