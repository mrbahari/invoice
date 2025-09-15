'use client';

import { Button } from '@/components/ui/button';
import { Printer, CreditCard } from 'lucide-react';

export function InvoiceActions() {
    
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
        window.print();
    }
  };

  const handlePayment = () => {
    // Placeholder for payment logic
    alert('در حال اتصال به درگاه پرداخت...');
  }

  return (
    <>
      <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handlePrint}>
        <Printer className="h-3.5 w-3.5" />
        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
          چاپ / PDF
        </span>
      </Button>
      <Button size="sm" className="h-8 gap-1" onClick={handlePayment}>
        <CreditCard className="h-3.5 w-3.5" />
        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
          پرداخت
        </span>
      </Button>
    </>
  );
}
