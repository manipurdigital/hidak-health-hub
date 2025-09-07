import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, User, Phone, Calendar, Package, Download } from "lucide-react";
import { useServiceRequests } from "@/hooks/service-request-hooks";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ServiceRequestsTab = () => {
  const { data: serviceRequests, isLoading, refetch } = useServiceRequests();
  const { toast } = useToast();

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

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-intake-download-url', {
        body: { filePath }
      });

      if (error) throw error;

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download started",
        description: `Downloading ${fileName}`,
      });
    } catch (error: any) {
      console.error('Download failed:', error);
      toast({
        title: "Download failed",
        description: error.message || "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Request status changed to ${newStatus}`,
      });

      refetch(); // Refresh the data
    } catch (error: any) {
      console.error('Status update failed:', error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
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
              <TableHead>Actions</TableHead>
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
                  <Select
                    value={request.status}
                    onValueChange={(value) => updateRequestStatus(request.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
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