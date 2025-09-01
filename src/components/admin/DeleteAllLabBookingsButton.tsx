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

export const DeleteAllLabBookingsButton: React.FC = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDeleteAll = async () => {
    if (confirmText !== 'DELETE ALL LAB BOOKINGS') {
      toast.error('Please type exactly "DELETE ALL LAB BOOKINGS" to confirm');
      return;
    }

    setIsDeleting(true);
    
    try {
      // First check if there are any lab bookings to delete
      const { count, error: countError } = await supabase
        .from('lab_bookings')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        throw countError;
      }

      if (count === 0) {
        toast.success('No lab bookings found to delete');
        setIsDialogOpen(false);
        setConfirmText('');
        return;
      }

      // Use the edge function to delete all lab bookings
      const { data, error } = await supabase.functions.invoke('delete-all-lab-bookings', {
        method: 'POST'
      });

      if (error) {
        throw error;
      }

      const response = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (response.success) {
        toast.success(`Successfully deleted ${response.deletedCount || count} lab bookings and related data`);
        setIsDialogOpen(false);
        setConfirmText('');
        // Trigger a page refresh to update the lab bookings list
        window.location.reload();
      } else {
        throw new Error(response.message || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error deleting lab bookings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete lab bookings');
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
          Delete All Lab Bookings
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Delete All Lab Bookings
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p className="font-semibold text-destructive">
              ⚠️ This action is IRREVERSIBLE and will permanently delete ALL lab bookings from the database.
            </p>
            <p>
              This will affect:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>All lab booking records</li>
              <li>Related lab reports (will be removed)</li>
              <li>Lab collection schedules</li>
              <li>Patient test history and analytics</li>
              <li>Lab collection data across the entire platform</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Only proceed if you are absolutely certain this is what you want to do.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-3">
          <Label htmlFor="confirm-input">
            Type <span className="font-mono bg-muted px-1 rounded">DELETE ALL LAB BOOKINGS</span> to confirm:
          </Label>
          <Input
            id="confirm-input"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE ALL LAB BOOKINGS"
            className={confirmText === 'DELETE ALL LAB BOOKINGS' ? 'border-destructive' : ''}
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
            disabled={confirmText !== 'DELETE ALL LAB BOOKINGS' || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete All Lab Bookings'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};