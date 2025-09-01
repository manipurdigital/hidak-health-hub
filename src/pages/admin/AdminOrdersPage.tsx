import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, MapPin, MessageCircle, Package, User, Phone, Copy, Share } from "lucide-react";
import { AdminLayoutWrapper } from "@/components/AdminLayoutWrapper";
import { WhatsAppShareButton } from "@/components/WhatsAppShareButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

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
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};

const AdminOrdersPage = () => {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
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
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Order[];
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
      ? `\n📍 Location: https://www.google.com/maps/dir/?api=1&destination=${order.patient_location_lat},${order.patient_location_lng}`
      : '';

    return `🆘 *NEW ORDER CONFIRMED* 🆘

📦 *Order:* ${order.order_number}
👤 *Patient:* ${order.patient_name}
📱 *Phone:* ${order.patient_phone?.replace(/(\d{2})(\d{4})(\d{4})/, '$1xxxx$3')}
💰 *Amount:* ₹${order.total_amount}

*Items:*
${items}

📮 *Address:*
${order.shipping_address}${googleMapsLink}

⚡ Please assign delivery agent immediately!`;
  };

  const copyWhatsAppText = (order: Order) => {
    const message = buildOrderWhatsAppMessage(order);
    navigator.clipboard.writeText(message);
    toast({
      title: "Copied to clipboard",
      description: "WhatsApp message copied successfully"
    });
  };

  const openWhatsAppToNumber = (order: Order, phoneNumber: string) => {
    const message = buildOrderWhatsAppMessage(order);
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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
              Manage medicine orders and deliveries
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              All Orders ({orders?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
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
                      <Badge className={statusColors[order.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyWhatsAppText(order)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const phone = prompt("Enter delivery agent's phone number:");
                            if (phone) openWhatsAppToNumber(order, phone);
                          }}
                        >
                          <Share className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {order.patient_location_lat && order.patient_location_lng && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(
                              getGoogleMapsUrl(
                                order.patient_location_lat!,
                                order.patient_location_lng!,
                                order.shipping_address
                              ),
                              '_blank'
                            )}
                          >
                            <MapPin className="h-4 w-4 mr-1" />
                            Navigate
                          </Button>
                        )}
                        <WhatsAppShareButton
                          bookingData={{
                            orderNumber: order.order_number,
                            patientName: order.patient_name,
                            patientPhone: order.patient_phone,
                            totalAmount: order.total_amount,
                            medicines: order.order_items.map(item => ({
                              name: item.medicine.name,
                              quantity: item.quantity
                            }))
                          }}
                          pickupLocation={{
                            address: order.shipping_address,
                            lat: order.patient_location_lat || 0,
                            lng: order.patient_location_lng || 0
                          }}
                          variant="outline"
                          size="sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Package className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {selectedOrder && (
          <Card>
            <CardHeader>
              <CardTitle>Order Details - {selectedOrder.order_number}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Patient Information</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Name:</strong> {selectedOrder.patient_name}</p>
                    <p><strong>Phone:</strong> {selectedOrder.patient_phone}</p>
                    <p><strong>Address:</strong> {selectedOrder.shipping_address}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Order Information</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Total:</strong> ₹{selectedOrder.total_amount}</p>
                    <p><strong>Status:</strong> 
                      <Badge className={`ml-2 ${statusColors[selectedOrder.status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}`}>
                        {selectedOrder.status}
                      </Badge>
                    </p>
                    <p><strong>Payment:</strong> 
                      <Badge variant="outline" className="ml-2">
                        {selectedOrder.payment_status}
                      </Badge>
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Medicines</h3>
                <div className="space-y-2">
                  {selectedOrder.order_items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span>{item.medicine.name}</span>
                      <span>Qty: {item.quantity} × ₹{item.unit_price}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                {selectedOrder.patient_location_lat && selectedOrder.patient_location_lng && (
                  <Button
                    onClick={() => window.open(
                      getGoogleMapsUrl(
                        selectedOrder.patient_location_lat!,
                        selectedOrder.patient_location_lng!,
                        selectedOrder.shipping_address
                      ),
                      '_blank'
                    )}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Open in Google Maps
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => copyWhatsAppText(selectedOrder)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy WhatsApp Text
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const phone = prompt("Enter delivery agent's phone number:");
                    if (phone) openWhatsAppToNumber(selectedOrder, phone);
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send to Agent
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayoutWrapper>
  );
};

export default AdminOrdersPage;