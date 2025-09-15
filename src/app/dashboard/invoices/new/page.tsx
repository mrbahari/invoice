import { InvoiceCreator } from '@/components/dashboard/invoice-creator';
import { customers, products } from '@/lib/data';

export default function NewInvoicePage() {
    // In a real app, you'd fetch this data from a database
    return <InvoiceCreator customers={customers} products={products} />;
}
