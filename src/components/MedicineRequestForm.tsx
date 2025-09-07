import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCreateMedicineRequest } from '@/hooks/medicine-request-hooks';
import { MessageCircle, Phone } from 'lucide-react';

const medicineRequestSchema = z.object({
  customer_name: z.string().min(2, 'Name must be at least 2 characters'),
  customer_phone: z.string().min(10, 'Please enter a valid phone number'),
  medicine_names: z.string().min(2, 'Please enter medicine names'),
  notes: z.string().optional(),
});

type MedicineRequestForm = z.infer<typeof medicineRequestSchema>;

interface MedicineRequestFormProps {
  onSuccess?: () => void;
}

export const MedicineRequestForm: React.FC<MedicineRequestFormProps> = ({ onSuccess }) => {
  const createRequest = useCreateMedicineRequest();
  
  const form = useForm<MedicineRequestForm>({
    resolver: zodResolver(medicineRequestSchema),
    defaultValues: {
      customer_name: '',
      customer_phone: '',
      medicine_names: '',
      notes: '',
    },
  });

  const onSubmit = async (data: MedicineRequestForm) => {
    await createRequest.mutateAsync({
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      medicine_names: data.medicine_names,
      notes: data.notes,
    });
    form.reset();
    onSuccess?.();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          Request Medicine
        </CardTitle>
        <CardDescription>
          Can't find what you're looking for? Let us help you find it!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customer_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="customer_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your phone number" 
                      type="tel" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="medicine_names"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medicine Names</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter medicine names (one per line)"
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any specific requirements or details"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={createRequest.isPending}
            >
              {createRequest.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
            
            <p className="text-sm text-muted-foreground text-center">
              We'll contact you within 24 hours with availability and pricing details.
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};