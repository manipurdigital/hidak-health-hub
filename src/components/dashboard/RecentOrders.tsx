import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Package, Truck, CheckCircle } from 'lucide-react';

const RecentOrders = () => {
  const orders = [
    {
      id: "ORD-20250115-001",
      items: "Paracetamol 500mg, Vitamin D3",
      amount: "₹299",
      status: "delivered",
      date: "2025-01-15"
    },
    {
      id: "ORD-20250114-002", 
      items: "Cough Syrup, Antibiotics",
      amount: "₹456",
      status: "in_transit",
      date: "2025-01-14"
    },
    {
      id: "ORD-20250113-003",
      items: "Blood Pressure Monitor",
      amount: "₹1,299", 
      status: "processing",
      date: "2025-01-13"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_transit': return <Truck className="w-4 h-4 text-blue-600" />;
      case 'processing': return <Package className="w-4 h-4 text-yellow-600" />;
      default: return <ShoppingBag className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'in_transit': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          Recent Orders
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 text-sm font-medium text-muted-foreground">Order ID</th>
                <th className="pb-2 text-sm font-medium text-muted-foreground">Items</th>
                <th className="pb-2 text-sm font-medium text-muted-foreground">Amount</th>
                <th className="pb-2 text-sm font-medium text-muted-foreground">Status</th>
                <th className="pb-2 text-sm font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="py-3 text-sm font-mono">{order.id}</td>
                  <td className="py-3 text-sm">{order.items}</td>
                  <td className="py-3 text-sm font-medium">{order.amount}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </td>
                  <td className="py-3 text-sm text-muted-foreground">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentOrders;