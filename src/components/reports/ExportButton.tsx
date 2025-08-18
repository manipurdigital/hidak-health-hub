import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface Column {
  header: string;
  accessor: string;
  format?: 'currency' | 'percentage' | 'date';
}

interface ExportButtonProps {
  data: any[];
  columns: Column[];
  filename: string;
}

export function ExportButton({ data, columns, filename }: ExportButtonProps) {
  const formatValue = (value: any, format?: string) => {
    if (value === null || value === undefined) return '';
    
    switch (format) {
      case 'currency':
        return Number(value).toFixed(2);
      case 'percentage':
        return Number(value).toFixed(2);
      case 'date':
        return new Date(value).toLocaleDateString();
      default:
        return value;
    }
  };

  const exportToCSV = () => {
    if (!data || data.length === 0) {
      return;
    }

    // Create CSV headers
    const headers = columns.map(col => col.header).join(',');
    
    // Create CSV rows
    const rows = data.map(row => 
      columns.map(col => {
        const value = formatValue(row[col.accessor], col.format);
        // Escape commas and quotes in values
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    );

    // Combine headers and rows
    const csvContent = [headers, ...rows].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button variant="outline" size="sm" onClick={exportToCSV}>
      <Download className="h-4 w-4 mr-2" />
      Export CSV
    </Button>
  );
}