
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Percent } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const commissionSchema = z.object({
  platform_commission_rate: z.number().min(0).max(100),
});

type CommissionFormData = z.infer<typeof commissionSchema>;

interface CenterCommissionFormProps {
  centerId: string;
  centerName: string;
  currentRate: number;
}

export function CenterCommissionForm({ centerId, centerName, currentRate }: CenterCommissionFormProps) {
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, formState: { errors } } = useForm<CommissionFormData>({
    resolver: zodResolver(commissionSchema),
    defaultValues: {
      platform_commission_rate: Math.round(currentRate * 100), // Convert from decimal to percentage
    },
  });

  const updateCommissionMutation = useMutation({
    mutationFn: async (data: CommissionFormData) => {
      const { error } = await supabase
        .from('diagnostic_centers')
        .update({
          platform_commission_rate: data.platform_commission_rate / 100, // Convert percentage to decimal
        })
        .eq('id', centerId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Commission Updated",
        description: `Commission rate for ${centerName} has been updated successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['diagnostic-centers'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CommissionFormData) => {
    updateCommissionMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Percent className="h-5 w-5" />
          Commission Settings - {centerName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="platform_commission_rate">Platform Commission (%)</Label>
            <Input
              id="platform_commission_rate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              {...register('platform_commission_rate', { valueAsNumber: true })}
              placeholder="Enter commission percentage (0-100)"
            />
            {errors.platform_commission_rate && (
              <p className="text-sm text-destructive mt-1">
                Commission rate must be between 0 and 100
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Current rate: {Math.round(currentRate * 100)}% 
              (Platform gets {Math.round(currentRate * 100)}%, Partner gets {Math.round((1 - currentRate) * 100)}%)
            </p>
          </div>
          <Button 
            type="submit" 
            disabled={updateCommissionMutation.isPending}
          >
            {updateCommissionMutation.isPending ? 'Updating...' : 'Update Commission'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
