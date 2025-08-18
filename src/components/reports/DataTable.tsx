import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface Column {
  header: string;
  accessor: string;
  format?: 'currency' | 'percentage' | 'date';
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  isLoading?: boolean;
  onRowClick?: (row: any) => void;
}

export function DataTable({ data, columns, isLoading, onRowClick }: DataTableProps) {
  const formatValue = (value: any, format?: string) => {
    if (value === null || value === undefined) return '-';
    
    switch (format) {
      case 'currency':
        return `₹${Number(value).toLocaleString()}`;
      case 'percentage':
        return `${Number(value).toFixed(2)}%`;
      case 'date':
        return new Date(value).toLocaleDateString();
      default:
        return value;
    }
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.accessor}>{column.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={column.accessor}>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No data available for the selected period
      </div>
    );
  }

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.accessor}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow 
              key={index}
              className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <TableCell key={column.accessor}>
                  {formatValue(row[column.accessor], column.format)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}