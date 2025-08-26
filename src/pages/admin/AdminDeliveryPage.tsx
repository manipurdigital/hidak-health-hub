import { useState } from 'react';
import { Plus, Search, Filter, Users, Package, Truck, AlertCircle } from 'lucide-react';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RiderForm } from '@/components/delivery/RiderForm';
import { DeliveryJobCard } from '@/components/delivery/DeliveryJobCard';

// Mock data for demonstration since tables don't exist yet
const mockRiders = [
  {
    id: '1',
    code: 'RID-001',
    full_name: 'John Doe',
    phone: '+1234567890',
    vehicle_type: 'bike' as const,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    code: 'RID-002',
    full_name: 'Jane Smith',
    phone: '+0987654321',
    vehicle_type: 'scooter' as const,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const mockDeliveryJobs = [
  {
    id: '1',
    order_id: 'ORD-123456',
    rider_id: '1',
    pickup_address: { address_line_1: '123 Store St', city: 'Mumbai', postal_code: '400001' },
    delivery_address: { address_line_1: '456 Customer Ave', city: 'Mumbai', postal_code: '400002' },
    status: 'assigned' as const,
    assigned_at: new Date().toISOString(),
    picked_up_at: null,
    delivered_at: null,
    estimated_delivery_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    delivery_fee: 50,
    distance_km: 5.2,
    created_at: new Date().toISOString(),
    rider: mockRiders[0],
    order: {
      id: 'ORD-123456',
      total_amount: 1250,
      user_id: 'user1',
    },
  },
  {
    id: '2',
    order_id: 'ORD-789012',
    rider_id: null,
    pickup_address: { address_line_1: '789 Warehouse Rd', city: 'Delhi', postal_code: '110001' },
    delivery_address: { address_line_1: '321 Home St', city: 'Delhi', postal_code: '110002' },
    status: 'pending' as const,
    assigned_at: null,
    picked_up_at: null,
    delivered_at: null,
    estimated_delivery_time: null,
    delivery_fee: 75,
    distance_km: 8.1,
    created_at: new Date().toISOString(),
    rider: undefined,
    order: {
      id: 'ORD-789012',
      total_amount: 890,
      user_id: 'user2',
    },
  },
];

export default function AdminDeliveryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isRiderFormOpen, setIsRiderFormOpen] = useState(false);
  const [selectedRider, setSelectedRider] = useState<any>(null);

  // Mock stats
  const stats = {
    totalRiders: mockRiders.length,
    activeRiders: mockRiders.filter(r => r.is_active).length,
    pendingJobs: mockDeliveryJobs.filter(j => j.status === 'pending').length,
    inTransitJobs: 0, // Fix type issue - no in_transit jobs in mock data
  };

  const filteredJobs = mockDeliveryJobs.filter(job => {
    const matchesSearch = job.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.rider?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredRiders = mockRiders.filter(rider =>
    rider.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rider.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateRider = (data: any) => {
    console.log('Creating rider:', data);
    setIsRiderFormOpen(false);
  };

  const handleUpdateRider = (data: any) => {
    console.log('Updating rider:', data);
    setIsRiderFormOpen(false);
    setSelectedRider(null);
  };

  const handleAssignRider = (jobId: string) => {
    console.log('Assigning rider to job:', jobId);
  };

  const handleUpdateJobStatus = (jobId: string, status: string) => {
    console.log('Updating job status:', jobId, status);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Delivery Management</h1>
            <p className="text-muted-foreground">
              Manage delivery riders, jobs, and track deliveries
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Riders</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRiders}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeRiders} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Riders</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeRiders}</div>
              <p className="text-xs text-muted-foreground">
                Available for delivery
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Jobs</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingJobs}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting assignment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Transit</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inTransitJobs}</div>
              <p className="text-xs text-muted-foreground">
                Currently delivering
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="jobs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="jobs">Delivery Jobs</TabsTrigger>
            <TabsTrigger value="riders">Riders</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search jobs by order ID or rider name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="picked_up">Picked Up</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4">
              {filteredJobs.map(job => (
                <DeliveryJobCard
                  key={job.id}
                  job={job}
                  onAssignRider={handleAssignRider}
                  onUpdateStatus={handleUpdateJobStatus}
                />
              ))}
              {filteredJobs.length === 0 && (
                <Card>
                  <CardContent className="flex items-center justify-center py-6">
                    <p className="text-muted-foreground">No delivery jobs found</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="riders" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex-1 relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search riders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Dialog open={isRiderFormOpen} onOpenChange={setIsRiderFormOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rider
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Rider</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4">
                    <RiderForm
                      onSubmit={handleCreateRider}
                      onCancel={() => setIsRiderFormOpen(false)}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {filteredRiders.map(rider => (
                <Card key={rider.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <CardTitle className="text-lg">{rider.full_name}</CardTitle>
                          <CardDescription>{rider.code}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={rider.is_active ? 'default' : 'secondary'}>
                          {rider.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedRider(rider);
                            setIsRiderFormOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Phone</p>
                        <p className="font-medium">{rider.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Vehicle Type</p>
                        <p className="font-medium capitalize">{rider.vehicle_type}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredRiders.length === 0 && (
                <Card>
                  <CardContent className="flex items-center justify-center py-6">
                    <p className="text-muted-foreground">No riders found</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Rider Dialog */}
        <Dialog open={isRiderFormOpen && !!selectedRider} onOpenChange={(open) => {
          if (!open) {
            setIsRiderFormOpen(false);
            setSelectedRider(null);
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Rider</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {selectedRider && (
                <RiderForm
                  initialData={selectedRider}
                  onSubmit={handleUpdateRider}
                  onCancel={() => {
                    setIsRiderFormOpen(false);
                    setSelectedRider(null);
                  }}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}