'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { File } from 'lucide-react';
import { downloadCSV } from '@/lib/utils';
import type { Invoice } from '@/lib/definitions';
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
  defaultTab: string;
  tableComponent: React.ReactNode; // Can be anything now, but we'll render our own table
  pageActions: React.ReactNode;
};

export function InvoiceTabs({ tabs, defaultTab, pageActions }: InvoiceTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  const handleExport = () => {
    const activeInvoices = tabs.find(tab => tab.value === activeTab)?.invoices;
    if (activeInvoices) {
      downloadCSV(activeInvoices, `invoices-${activeTab}.csv`);
    }
  };

  return (
    <Tabs defaultValue={defaultTab} onValueChange={setActiveTab}>
      <div className="flex items-center">
        <TabsList>
          {tabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className={tab.className}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="mr-auto flex items-center gap-2">
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
          <InvoiceTable invoiceList={tab.invoices} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
