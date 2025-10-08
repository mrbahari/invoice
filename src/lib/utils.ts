import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | '' | null | undefined, options?: Intl.NumberFormatOptions) {
  const numericAmount = Number(amount);
  if (amount === '' || amount === null || amount === undefined || isNaN(numericAmount)) return '';

  return new Intl.NumberFormat('fa-IR', {
    style: 'currency',
    currency: 'IRR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options
  }).format(numericAmount);
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
  // Remove common Persian store-related words and then all non-alphabetic chars
  const cleanedName = storeName
    .replace(/فروشگاه/g, '')
    .replace(/شرکت/g, '')
    .replace(/گروه/g, '')
    .replace(/[^a-zA-Z]/g, '') // Keep only English letters
    .trim();

  if (cleanedName.length > 0) {
    return cleanedName.slice(0, 3).toUpperCase();
  }
  
  // Fallback for names with no english letters
  return 'INV';
}

export const formatNumber = (num: number | '' | null | undefined, options?: Intl.NumberFormatOptions): string => {
    if (num === '' || num === null || num === undefined || isNaN(Number(num))) return '';
    return new Intl.NumberFormat('fa-IR', { useGrouping: false, ...options }).format(Number(num));
};
  
const convertPersianToArabic = (str: string): string => {
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const englishDigits = '0123456789';
    let numericString = String(str);
    for (let i = 0; i < 10; i++) {
        numericString = numericString.replace(new RegExp(persianDigits[i], 'g'), englishDigits[i]);
    }
    return numericString;
};

export const parseFormattedNumber = (str: string): number | '' => {
    if (!str) return '';
    const numericString = convertPersianToArabic(str).replace(/[^0-9.]/g, '');
    
    // Handle multiple dots by keeping only the first one
    const parts = numericString.split('.');
    const integerPart = parts[0];
    const fractionalPart = parts.slice(1).join('');
    const finalString = fractionalPart ? `${integerPart}.${fractionalPart}` : integerPart;

    const number = parseFloat(finalString);
    return isNaN(number) ? '' : number;
};

export const parseCurrency = (str: string): number | '' => {
    if (!str) return '';
    // Convert to English digits and remove everything except digits and a decimal point
    const numericString = convertPersianToArabic(str).replace(/[^0-9.]/g, '');
    const number = parseFloat(numericString);
    return isNaN(number) ? '' : number;
}