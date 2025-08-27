
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PieChart, DollarSign } from 'lucide-react';

interface DiagnosticCenter {
  id: string;
  name: string;
}

interface SplitSummary {
  online_platform_receipts: number;
  online_partner_payout_due: number;
  cod_partner_receipts: number;
  cod_platform_commission_due: number;
  total_tests: number;
}

export function LabSplitPreview() {
  const [selectedCenter, setSelectedCenter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch diagnostic centers
  const { data: centers = [] } = useQuery({
    queryKey: ['diagnostic-centers'],
    queryFn: async (): Promise<DiagnosticCenter[]> => {
      const { data, error } = await supabase
        .from('diagnostic_centers')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch split summary when all filters are set
  const { data: splitSummary, isLoading } = useQuery({
    queryKey: ['lab-split-summary', selectedCenter, startDate, endDate],
    queryFn: async (): Promise<SplitSummary> => {
      const { data, error } = await (supabase as any).rpc('admin_lab_split_summary', {
        p_center_id: selectedCenter,
        p_start_date: startDate,
        p_end_date: endDate
      });
      if (error) throw error;
      return data[0] || {
        online_platform_receipts: 0,
        online_partner_payout_due: 0,
        cod_partner_receipts: 0,
        cod_platform_commission_due: 0,
        total_tests: 0
      };
    },
    enabled: !!(selectedCenter && startDate && endDate)
  });

  const formatCurrency = (value: number) => `₹${value.toFixed(2)}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Revenue Split Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="center">Diagnostic Center</Label>
            <Select value={selectedCenter} onValueChange={setSelectedCenter}>
              <SelectTrigger>
                <SelectValue placeholder="Select center" />
              </SelectTrigger>
              <SelectContent>
                {centers.map((center) => (
                  <SelectItem key={center.id} value={center.id}>
                    {center.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Summary */}
        {selectedCenter && startDate && endDate && (
          <div className="space-y-4">
            {isLoading ? (
              <p className="text-center text-muted-foreground">Loading split summary...</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-green-600">
                        Online Payments (Platform Collected)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Total Receipts:</span>
                          <span className="font-medium">{formatCurrency(splitSummary?.online_platform_receipts || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Partner Payout Due:</span>
                          <span className="font-medium text-orange-600">
                            {formatCurrency(splitSummary?.online_partner_payout_due || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-sm font-medium">Platform Keeps:</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency((splitSummary?.online_platform_receipts || 0) - (splitSummary?.online_partner_payout_due || 0))}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-blue-600">
                        Cash on Delivery (Partner Collected)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Partner Receipts:</span>
                          <span className="font-medium">{formatCurrency(splitSummary?.cod_partner_receipts || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Commission Due to Us:</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(splitSummary?.cod_platform_commission_due || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-sm font-medium">Partner Keeps:</span>
                          <span className="font-medium text-blue-600">
                            {formatCurrency((splitSummary?.cod_partner_receipts || 0) - (splitSummary?.cod_platform_commission_due || 0))}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">{splitSummary?.total_tests || 0}</p>
                        <p className="text-sm text-muted-foreground">Total Tests</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(
                            ((splitSummary?.online_platform_receipts || 0) - (splitSummary?.online_partner_payout_due || 0)) +
                            (splitSummary?.cod_platform_commission_due || 0)
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">Platform Total</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(
                            (splitSummary?.online_partner_payout_due || 0) +
                            ((splitSummary?.cod_partner_receipts || 0) - (splitSummary?.cod_platform_commission_due || 0))
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">Partner Total</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
