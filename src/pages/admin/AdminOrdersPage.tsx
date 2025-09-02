import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, MapPin, MessageCircle, Package, User, Phone, Copy, Share } from "lucide-react";
import { AdminLayoutWrapper } from "@/components/AdminLayoutWrapper";
import { WhatsAppShareButton } from "@/components/WhatsAppShareButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { OrderFilters } from "@/components/admin/OrderFilters";
import { ManualAssignmentPanel } from "@/components/admin/ManualAssignmentPanel";
import { ServiceAreaGuard } from "@/components/ServiceAreaGuard";
import { format } from "date-fns";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { useNotifyAdminWhatsApp } from "@/hooks/manual-assignment-hooks";
import { LabOrdersTab } from "@/components/admin/LabOrdersTab";
import { DeleteAllOrdersButton } from "@/components/admin/DeleteAllOrdersButton";

interface Order {
  id: string;
  order_number: string;
  patient_name: string;
  patient_phone: string;
  shipping_address: string;
  patient_location_lat: number | null;
  patient_location_lng: number | null;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  is_within_service_area?: boolean;
  geofence_validated_at?: string;
  assignment_notes?: string;
  order_items: {
    quantity: number;
    unit_price: number;
    medicine: {
      name: string;
    };
  }[];
}


const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  "out for delivery": "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};

const orderStatuses = [
  "pending",
  "processing", 
  "confirmed",
  "out for delivery",
  "delivered"
];

const AdminOrdersPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { filters, updateFilters } = useUrlFilters();
  const notifyAdmin = useNotifyAdminWhatsApp();

  // Set default date range to today if no filters are set
  const today = new Date();
  const defaultFrom = filters.from || format(today, 'yyyy-MM-dd');
  const defaultTo = filters.to || format(today, 'yyyy-MM-dd');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders', filters],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            unit_price,
            medicine:medicines (
              name
            )
          )
        `);

      // Apply date filters
      if (defaultFrom) {
        query = query.gte('created_at', `${defaultFrom}T00:00:00.000Z`);
      }
      if (defaultTo) {
        query = query.lte('created_at', `${defaultTo}T23:59:59.999Z`);
      }

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Apply search filter
      if (filters.q) {
        query = query.or(`order_number.ilike.%${filters.q}%,patient_name.ilike.%${filters.q}%,patient_phone.ilike.%${filters.q}%`);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data as Order[];
    }
  });

  // Get unfiltered count for display
  const { data: totalCount } = useQuery({
    queryKey: ['admin-orders-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    }
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast({
        title: "Status updated",
        description: "Order status has been updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive"
      });
    }
  });

  const getGoogleMapsUrl = (lat: number, lng: number, address: string) => {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(address)}`;
  };

  const buildOrderWhatsAppMessage = (order: Order): string => {
    const items = order.order_items.map((item) => 
      `• ${item.medicine.name} - Qty: ${item.quantity}`
    ).join('\n');

    const googleMapsLink = order.patient_location_lat && order.patient_location_lng 
      ? `\n📍 *GPS Location:* https://www.google.com/maps/dir/?api=1&destination=${order.patient_location_lat},${order.patient_location_lng}`
      : '';

    return `🆘 *NEW MEDICINE ORDER CONFIRMED* 🆘

📦 *Order:* ${order.order_number}
👤 *Patient:* ${order.patient_name}
📱 *Phone:* ${order.patient_phone}
💰 *Amount:* ₹${order.total_amount}

💊 *Medicines:*
${items}

🏠 *Delivery Address:*
${order.shipping_address}${googleMapsLink}

⚡ Please assign delivery agent immediately!`;
  };

  const copyWhatsAppText = async (order: Order) => {
    const message = buildOrderWhatsAppMessage(order);
    try {
      await navigator.clipboard.writeText(message);
      toast({
        title: "Copied to clipboard",
        description: "WhatsApp message copied successfully"
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const openWhatsAppToNumber = (order: Order, phoneNumber: string) => {
    const message = buildOrderWhatsAppMessage(order);
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleDateRangeChange = (range: { from: Date | null; to: Date | null }) => {
    updateFilters({
      from: range.from ? format(range.from, 'yyyy-MM-dd') : undefined,
      to: range.to ? format(range.to, 'yyyy-MM-dd') : undefined
    });
  };

  const handleStatusChange = (status: string) => {
    updateFilters({ status: status === 'all' ? undefined : status });
  };

  const handleSearchChange = (query: string) => {
    updateFilters({ q: query || undefined });
  };

  const dateRange = {
    from: filters.from ? new Date(filters.from) : null,
    to: filters.to ? new Date(filters.to) : null
  };

  if (isLoading) {
    return (
      <AdminLayoutWrapper>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayoutWrapper>
    );
  }

  return (
    <AdminLayoutWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Orders Management</h1>
            <p className="text-muted-foreground">
              Manage medicine and lab orders
            </p>
          </div>
        </div>

        {/* Temporarily comment out to debug */}
        {/*
        <OrderFilters
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          status={filters.status || 'all'}
          onStatusChange={handleStatusChange}
          searchQuery={filters.q || ''}
          onSearchChange={handleSearchChange}
          totalCount={totalCount || 0}
          filteredCount={orders?.length || 0}
        />
        */}
        
        {/* Enhanced filter structure */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4 p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters</span>
              </div>
              {(filters.status !== 'all' && filters.status) || filters.q && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateFilters({ status: undefined, q: undefined })}
                  className="h-6 px-2 text-xs"
                >
                  Clear filters
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Date Presets */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Date Range</label>
                <div className="flex flex-col gap-1">
                  <Button
                    variant={(!filters.from && !filters.to) || (filters.from === format(today, 'yyyy-MM-dd') && filters.to === format(today, 'yyyy-MM-dd')) ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateFilters({ 
                      from: format(today, 'yyyy-MM-dd'), 
                      to: format(today, 'yyyy-MM-dd') 
                    })}
                    className="justify-start text-xs"
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const yesterday = new Date(today);
                      yesterday.setDate(yesterday.getDate() - 1);
                      updateFilters({ 
                        from: format(yesterday, 'yyyy-MM-dd'), 
                        to: format(yesterday, 'yyyy-MM-dd') 
                      });
                    }}
                    className="justify-start text-xs"
                  >
                    Yesterday
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const weekAgo = new Date(today);
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      updateFilters({ 
                        from: format(weekAgo, 'yyyy-MM-dd'), 
                        to: format(today, 'yyyy-MM-dd') 
                      });
                    }}
                    className="justify-start text-xs"
                  >
                    Last 7 days
                  </Button>
                </div>
              </div>
              
              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="out for delivery">Out for Delivery</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Search */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Search</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by order number, patient name, or phone..."
                    value={filters.q || ''}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                  />
                </div>
              </div>
            </div>
            
            {/* Active filter chips */}
            {((filters.status && filters.status !== 'all') || filters.q || filters.from || filters.to) && (
              <div className="flex flex-wrap gap-2">
                {filters.from && filters.to && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Date: {filters.from === filters.to ? format(new Date(filters.from), 'MMM dd, yyyy') : `${format(new Date(filters.from), 'MMM dd')} - ${format(new Date(filters.to), 'MMM dd, yyyy')}`}
                  </Badge>
                )}
                {filters.status && filters.status !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Status: {filters.status}
                  </Badge>
                )}
                {filters.q && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Search: "{filters.q}"
                  </Badge>
                )}
              </div>
            )}
            
            {/* Results summary */}
            <div className="text-sm text-muted-foreground">
              Showing {orders?.length || 0} of {totalCount || 0} orders
              {filters.from && filters.to && (
                <span> for {filters.from === filters.to ? format(new Date(filters.from), 'MMM dd, yyyy') : `${format(new Date(filters.from), 'MMM dd')} - ${format(new Date(filters.to), 'MMM dd, yyyy')}`}</span>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="medicine" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="medicine">Medicine Orders</TabsTrigger>
            <TabsTrigger value="lab">Lab Orders</TabsTrigger>
          </TabsList>
          
          <TabsContent value="medicine">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Medicine Orders
                  </div>
                  <DeleteAllOrdersButton />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order Number</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Service Area</TableHead>
                      <TableHead>Forward to Agent</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders?.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{order.patient_name}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {order.patient_phone}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">₹{order.total_amount}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(order.created_at), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(order.created_at), 'hh:mm a')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={order.status}
                            onValueChange={(status) => updateOrderStatus.mutate({ orderId: order.id, status })}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue>
                                <Badge className={statusColors[order.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
                                  {order.status}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {orderStatuses.map((status) => (
                                <SelectItem key={status} value={status}>
                                  <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
                                    {status}
                                  </Badge>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <ServiceAreaGuard
                            lat={order.patient_location_lat || 24.817}
                            lng={order.patient_location_lng || 93.938}
                            serviceType="delivery"
                            showWarning={false}
                          >
                            {(isServiceable) => (
                              <Badge variant={isServiceable ? "default" : "destructive"}>
                                {isServiceable ? "✓ Within Area" : "✗ Outside Area"}
                              </Badge>
                            )}
                          </ServiceAreaGuard>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyWhatsAppText(order)}
                              className="flex items-center gap-1"
                            >
                              <Copy className="h-3 w-3" />
                              Copy
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openWhatsAppToNumber(order, '+919876543210')}
                              className="flex items-center gap-1"
                            >
                              <Share className="h-3 w-3" />
                              Share
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.patient_location_lat && order.patient_location_lng && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(getGoogleMapsUrl(order.patient_location_lat!, order.patient_location_lng!, order.shipping_address), '_blank')}
                              className="flex items-center gap-1"
                            >
                              <MapPin className="h-3 w-3" />
                              Navigate
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="lab">
            <LabOrdersTab filters={filters} />
          </TabsContent>
        </Tabs>

        {/* Order Assignment Panel */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Order Assignment</h2>
                  <Button variant="ghost" onClick={() => setSelectedOrder(null)}>
                    ✕
                  </Button>
                </div>
                
                {/* Service Area Check */}
                <ServiceAreaGuard
                  lat={selectedOrder.patient_location_lat || 24.817}
                  lng={selectedOrder.patient_location_lng || 93.938}
                  serviceType="delivery"
                  showWarning={true}
                >
                  <div />
                </ServiceAreaGuard>

                {/* Order Details */}
                <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-medium mb-2">Order Details</h3>
                  <div className="text-sm space-y-1">
                    <div><strong>Order:</strong> {selectedOrder.order_number}</div>
                    <div><strong>Patient:</strong> {selectedOrder.patient_name}</div>
                    <div><strong>Phone:</strong> {selectedOrder.patient_phone}</div>
                    <div><strong>Amount:</strong> ₹{selectedOrder.total_amount}</div>
                    <div><strong>Address:</strong> {selectedOrder.shipping_address}</div>
                  </div>
                  <div className="mt-2">
                    <strong>Items:</strong>
                    <ul className="list-disc list-inside text-sm">
                      {selectedOrder.order_items.map((item, index) => (
                        <li key={index}>
                          {item.medicine.name} - Qty: {item.quantity} @ ₹{item.unit_price}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Assignment Panel */}
                <ManualAssignmentPanel
                  type="order"
                  data={selectedOrder}
                  onUpdate={() => {
                    queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
                    setSelectedOrder(null);
                  }}
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayoutWrapper>
  );
};

export default AdminOrdersPage;
