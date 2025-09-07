import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, User, Phone, Calendar, Package, Download } from "lucide-react";
import { useServiceRequests } from "@/hooks/service-request-hooks";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

const ServiceRequestsTab = () => {
  const { data: serviceRequests, isLoading } = useServiceRequests();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const downloadFile = (filePath: string, fileName: string) => {
    // This would need to be implemented with proper file download logic
    console.log('Download file:', filePath, fileName);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Service Requests
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Services</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Files</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {serviceRequests?.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{request.customer_name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {request.customer_phone}
                      </div>
                      {request.customer_email && (
                        <div className="text-xs text-muted-foreground">
                          {request.customer_email}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {request.services?.map((service, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {request.service_request_items?.map((item) => (
                      <div key={item.id} className="text-sm">
                        <span className="font-medium">{item.item_value}</span>
                        {item.quantity && item.quantity > 1 && (
                          <span className="text-muted-foreground"> x{item.quantity}</span>
                        )}
                        {item.notes && (
                          <div className="text-xs text-muted-foreground">{item.notes}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {request.service_request_files?.map((file) => (
                      <div key={file.id} className="flex items-center gap-1">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800"
                          onClick={() => downloadFile(file.file_path, file.file_name)}
                        >
                          {file.file_name}
                        </Button>
                        <Badge variant="secondary" className="text-xs">
                          {file.file_type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(request.status)}>
                    {request.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {format(new Date(request.created_at), 'MMM dd, yyyy')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(request.created_at), 'hh:mm a')}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {!serviceRequests?.length && (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No service requests found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceRequestsTab;