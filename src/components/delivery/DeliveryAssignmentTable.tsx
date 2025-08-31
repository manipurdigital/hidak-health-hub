import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
// Placeholder types and hooks for delivery assignments
interface DeliveryAssignmentFilters {
  status?: string;
  rider?: string;
}

interface DeliveryAssignment {
  id: string;
  status: string;
  order_id: string;
}

const useAdminDeliveryAssignments = () => ({
  data: [],
  isLoading: false,
  error: null
});

const useForceStatus = () => ({
  mutate: () => {},
  isLoading: false
});
import { AssignRiderDrawer } from './AssignRiderDrawer';
import { DeliveryDetailPanel } from './DeliveryDetailPanel';
import { useRealTimeDeliveryUpdates } from '@/hooks/realtime-delivery-hooks';
import { MoreHorizontal, Clock, CheckCircle, XCircle, Truck, Eye } from 'lucide-react';
import { format } from 'date-fns';

export function DeliveryAssignmentTable() {
  const [filters, setFilters] = useState<DeliveryAssignmentFilters>({});
  const [assignRiderOpen, setAssignRiderOpen] = useState(false);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState('');
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<DeliveryAssignment | null>(null);
  const [statusChangeDialog, setStatusChangeDialog] = useState<{
    open: boolean;
    orderNumber: string;
    status: string;
  }>({ open: false, orderNumber: '', status: '' });

  const { data: assignments = [], isLoading } = useAdminDeliveryAssignments();
  const forceStatusMutation = useForceStatus();
  
  // Enable real-time updates
  useRealTimeDeliveryUpdates();

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary' as const, icon: Clock, className: '' },
      on_the_way: { variant: 'default' as const, icon: Truck, className: '' },
      delivered: { variant: 'default' as const, icon: CheckCircle, className: 'bg-green-500 hover:bg-green-600' },
      cancelled: { variant: 'destructive' as const, icon: XCircle, className: '' },
    };

    const config = variants[status as keyof typeof variants] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge 
        variant={config.variant} 
        className={`flex items-center gap-1 ${config.className}`}
      >
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const handleAssignRider = (orderNumber: string) => {
    setSelectedOrderNumber(orderNumber);
    setAssignRiderOpen(true);
  };

  const handleViewDetails = (assignment: DeliveryAssignment) => {
    setSelectedAssignment(assignment);
    setDetailPanelOpen(true);
  };

  const handleStatusChange = (orderNumber: string, status: string) => {
    setStatusChangeDialog({ open: true, orderNumber, status });
  };

  const confirmStatusChange = async () => {
    if (!statusChangeDialog.orderNumber || !statusChangeDialog.status) return;

    try {
      forceStatusMutation.mutate({
        order_number: statusChangeDialog.orderNumber,
        status: statusChangeDialog.status
      });
      setStatusChangeDialog({ open: false, orderNumber: '', status: '' });
    } catch (error) {
      // Error handled by hook
    }
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return '-';
    return format(new Date(timestamp), 'MMM dd, HH:mm');
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading assignments...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Input
            placeholder="Filter by order number..."
            value={filters.order_number || ''}
            onChange={(e) => setFilters({ ...filters, order_number: e.target.value })}
          />
        </div>
        <div className="w-48">
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => 
              setFilters({ ...filters, status: value === 'all' ? undefined : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="on_the_way">On the way</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Input
            placeholder="Filter by rider code..."
            value={filters.rider_code || ''}
            onChange={(e) => setFilters({ ...filters, rider_code: e.target.value })}
          />
        </div>
        <Button onClick={() => setAssignRiderOpen(true)}>
          Assign Rider
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rider</TableHead>
              <TableHead>Assigned At</TableHead>
              <TableHead>Picked Up</TableHead>
              <TableHead>Delivered</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No delivery assignments found
                </TableCell>
              </TableRow>
            ) : (
              assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">
                    {assignment.order_number}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(assignment.status)}
                  </TableCell>
                  <TableCell>
                    {assignment.rider_code ? (
                      <div>
                        <div className="font-medium">{assignment.rider_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {assignment.rider_code}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatTimestamp(assignment.assigned_at)}
                  </TableCell>
                  <TableCell>
                    {formatTimestamp(assignment.picked_up_at)}
                  </TableCell>
                  <TableCell>
                    {formatTimestamp(assignment.delivered_at)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleViewDetails(assignment)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleAssignRider(assignment.order_number!)}
                        >
                          {assignment.rider_code ? 'Reassign Rider' : 'Assign Rider'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(assignment.order_number!, 'pending')}
                          disabled={assignment.status === 'pending'}
                        >
                          Set Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(assignment.order_number!, 'on_the_way')}
                          disabled={assignment.status === 'on_the_way'}
                        >
                          Set On The Way
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(assignment.order_number!, 'delivered')}
                          disabled={assignment.status === 'delivered'}
                        >
                          Set Delivered
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(assignment.order_number!, 'cancelled')}
                          disabled={assignment.status === 'cancelled'}
                        >
                          Cancel Delivery
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Assign Rider Drawer */}
      <AssignRiderDrawer
        open={assignRiderOpen}
        onOpenChange={setAssignRiderOpen}
        initialOrderNumber={selectedOrderNumber}
      />

      {/* Detail Panel */}
      <DeliveryDetailPanel
        open={detailPanelOpen}
        onOpenChange={setDetailPanelOpen}
        assignment={selectedAssignment}
      />

      {/* Status Change Confirmation Dialog */}
      <AlertDialog 
        open={statusChangeDialog.open} 
        onOpenChange={(open) => !open && setStatusChangeDialog({ open: false, orderNumber: '', status: '' })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the status of order {statusChangeDialog.orderNumber} to {statusChangeDialog.status.replace('_', ' ')}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmStatusChange}
              disabled={forceStatusMutation.isLoading}
            >
              {forceStatusMutation.isLoading ? 'Updating...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}