import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const DeleteAllOrdersButton: React.FC = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDeleteAll = async () => {
    if (confirmText !== 'DELETE ALL ORDERS') {
      toast.error('Please type exactly "DELETE ALL ORDERS" to confirm');
      return;
    }

    setIsDeleting(true);
    
    try {
      // First check if there are any orders to delete
      const { count, error: countError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        throw countError;
      }

      if (count === 0) {
        toast.success('No orders found to delete');
        setIsDialogOpen(false);
        setConfirmText('');
        return;
      }

      // Use the edge function to delete all orders
      const { data, error } = await supabase.functions.invoke('delete-all-orders', {
        method: 'POST'
      });

      if (error) {
        throw error;
      }

      const response = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (response.success) {
        toast.success(`Successfully deleted ${response.deletedCount || count} orders and related data`);
        setIsDialogOpen(false);
        setConfirmText('');
        // Trigger a page refresh to update the orders list
        window.location.reload();
      } else {
        throw new Error(response.message || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error deleting orders:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete orders');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          size="sm"
          className="flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete All Orders
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Delete All Orders
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p className="font-semibold text-destructive">
              ⚠️ This action is IRREVERSIBLE and will permanently delete ALL orders from the database.
            </p>
            <p>
              This will affect:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>All order records</li>
              <li>Related order items (will be removed)</li>
              <li>Related delivery assignments (will be removed)</li>
              <li>Order history and analytics</li>
              <li>Customer order data across the entire platform</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Only proceed if you are absolutely certain this is what you want to do.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-3">
          <Label htmlFor="confirm-input">
            Type <span className="font-mono bg-muted px-1 rounded">DELETE ALL ORDERS</span> to confirm:
          </Label>
          <Input
            id="confirm-input"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE ALL ORDERS"
            className={confirmText === 'DELETE ALL ORDERS' ? 'border-destructive' : ''}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={() => {
              setConfirmText('');
              setIsDialogOpen(false);
            }}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAll}
            disabled={confirmText !== 'DELETE ALL ORDERS' || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete All Orders'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};