
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { File } from 'lucide-react';
import { downloadCSV } from '@/lib/utils';
import type { Invoice, InvoiceStatus, Customer } from '@/lib/definitions';
import { useState } from 'react';
import { InvoiceTable } from '@/components/dashboard/invoice-table';

type TabData = {
  value: string;
  label: string;
  invoices: Invoice[];
  className?: string;
};

type InvoiceTabsProps = {
  tabs: TabData[];
  customers: Customer[];
  defaultTab: string;
  pageActions: React.ReactNode;
  onStatusChange: (invoiceId: string, status: InvoiceStatus) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onViewInvoice: (invoiceId: string) => void;
};

export function InvoiceTabs({ tabs, customers, defaultTab, pageActions, onStatusChange, onDeleteInvoice, onEditInvoice, onViewInvoice }: InvoiceTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  const handleExport = () => {
    const activeInvoices = tabs.find(tab => tab.value === activeTab)?.invoices;
    if (activeInvoices) {
        const headers = {
            invoiceNumber: 'شماره فاکتور',
            customerName: 'نام مشتری',
            customerEmail: 'ایمیل مشتری',
            date: 'تاریخ',
            status: 'وضعیت',
            subtotal: 'جمع جزء',
            discount: 'تخفیف',
            tax: 'مالیات',
            total: 'جمع کل',
            description: 'توضیحات'
        };
      downloadCSV(activeInvoices, `invoices-${activeTab}.csv`, headers);
    }
  };

  return (
    <Tabs defaultValue={defaultTab} onValueChange={setActiveTab} dir="rtl">
      <div className="flex items-center">
        <TabsList>
          {tabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className={tab.className}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleExport}>
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              خروجی
            </span>
          </Button>
          {pageActions}
        </div>
      </div>
      {tabs.map(tab => (
        <TabsContent key={tab.value} value={tab.value}>
          <InvoiceTable 
            invoiceList={tab.invoices}
            customers={customers} 
            onStatusChange={onStatusChange}
            onDeleteInvoice={onDeleteInvoice}
            onRowClick={onEditInvoice}
            onViewInvoice={onViewInvoice}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
