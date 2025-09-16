import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fa-IR', {
    style: 'currency',
    currency: 'IRR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function downloadCSV(data: any[], filename: string = 'export.csv', headers?: Record<string, string>) {
    if (!data || data.length === 0) {
        return;
    }

    const processRow = (row: any) => {
        const newRow = { ...row };
        if (newRow.date) newRow.date = new Date(newRow.date).toLocaleDateString('fa-IR');
        // Remove complex objects for cleaner CSV
        delete newRow.items;
        delete newRow.id;
        delete newRow.customerId;
        return newRow;
    };
    
    const processedData = data.map(processRow);
    const headerKeys = headers ? Object.keys(headers) : Object.keys(processedData[0]);
    const displayHeaders = headers ? Object.values(headers) : headerKeys;

    const replacer = (key: any, value: any) => value === null ? '' : value;
    const csv = [
        displayHeaders.join(','),
        ...processedData.map(row => headerKeys.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
    ].join('\r\n');

    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

export function getStorePrefix(storeName: string): string {
  // Remove common Persian store-related words
  const cleanedName = storeName
    .replace(/فروشگاه/g, '')
    .replace(/شرکت/g, '')
    .replace(/گروه/g, '')
    .trim();

  // Extract the first 3 letters of the remaining words
  const words = cleanedName.split(/\s+/);
  const prefix = words
    .map(word => word.charAt(0))
    .join('')
    .slice(0, 3)
    .toUpperCase();
    
  // If prefix is less than 3 chars, pad it with the store name itself
  if (prefix.length < 3) {
      return (prefix + cleanedName.replace(/\s/g, '').slice(0,3)).slice(0,3).toUpperCase();
  }
  
  return prefix;
}
