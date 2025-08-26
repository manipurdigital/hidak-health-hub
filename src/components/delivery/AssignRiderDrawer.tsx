import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useAssignRider, useActiveRiders, useRecentOrders } from '@/hooks/delivery-assignment-hooks';
import { Loader2 } from 'lucide-react';

interface AssignRiderDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialOrderNumber?: string;
}

export function AssignRiderDrawer({ open, onOpenChange, initialOrderNumber = '' }: AssignRiderDrawerProps) {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [riderId, setRiderId] = useState('');

  const assignRiderMutation = useAssignRider();
  const { data: riders = [] } = useActiveRiders();
  const { data: recentOrders = [] } = useRecentOrders();

  const selectedRider = riders.find(r => r.id === riderId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !selectedRider) return;

    try {
      await assignRiderMutation.mutateAsync({
        order_number: orderNumber,
        rider_code: selectedRider.code
      });
      
      // Reset form and close drawer
      setOrderNumber('');
      setRiderId('');
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleOrderNumberChange = (value: string) => {
    setOrderNumber(value);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Assign Rider</SheetTitle>
            <SheetDescription>
              Assign a rider to a delivery order. Select from recent orders or enter manually.
            </SheetDescription>
          </SheetHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="order-number">Order Number</Label>
              <Input
                id="order-number"
                value={orderNumber}
                onChange={(e) => handleOrderNumberChange(e.target.value)}
                placeholder="Enter order number"
                list="recent-orders"
                required
              />
              <datalist id="recent-orders">
                {recentOrders.map((order) => (
                  <option key={order.id} value={order.order_number} />
                ))}
              </datalist>
              {recentOrders.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Recent orders: {recentOrders.slice(0, 5).map(o => o.order_number).join(', ')}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rider">Rider</Label>
              <Select value={riderId} onValueChange={setRiderId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a rider" />
                </SelectTrigger>
                <SelectContent>
                  {riders.map((rider) => (
                    <SelectItem key={rider.id} value={rider.id}>
                      {rider.full_name} ({rider.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={assignRiderMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!orderNumber || !riderId || assignRiderMutation.isPending}
            >
              {assignRiderMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Assign Rider
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}