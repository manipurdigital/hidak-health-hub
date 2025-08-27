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

export const DeleteAllMedicinesButton: React.FC = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDeleteAll = async () => {
    if (confirmText !== 'DELETE ALL MEDICINES') {
      toast.error('Please type exactly "DELETE ALL MEDICINES" to confirm');
      return;
    }

    setIsDeleting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('delete-all-medicines', {
        method: 'POST'
      });

      if (error) {
        throw error;
      }

      const response = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (response.success) {
        toast.success(`Successfully deleted ${response.deletedCount} medicines`);
        setIsDialogOpen(false);
        setConfirmText('');
        // Optionally trigger a page refresh or refetch medicines
        window.location.reload();
      } else {
        throw new Error(response.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error deleting medicines:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete medicines');
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
          Delete All Medicines
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Delete All Medicines
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p className="font-semibold text-destructive">
              ⚠️ This action is IRREVERSIBLE and will permanently delete ALL medicines from the database.
            </p>
            <p>
              This will affect:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>All medicine records</li>
              <li>Related cart items (will be orphaned)</li>
              <li>Related order items (historical data will be affected)</li>
              <li>Search functionality</li>
              <li>User experience across the entire platform</li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Only proceed if you are absolutely certain this is what you want to do.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-3">
          <Label htmlFor="confirm-input">
            Type <span className="font-mono bg-muted px-1 rounded">DELETE ALL MEDICINES</span> to confirm:
          </Label>
          <Input
            id="confirm-input"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE ALL MEDICINES"
            className={confirmText === 'DELETE ALL MEDICINES' ? 'border-destructive' : ''}
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
            disabled={confirmText !== 'DELETE ALL MEDICINES' || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete All Medicines'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};