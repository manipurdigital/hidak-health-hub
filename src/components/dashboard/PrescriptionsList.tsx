import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, User } from 'lucide-react';

const PrescriptionsList = () => {
  const prescriptions = [
    {
      id: "RX-20250115-001",
      doctor: "Dr. Sarah Wilson",
      date: "2025-01-15",
      medications: ["Paracetamol 500mg", "Vitamin D3"],
      status: "active"
    },
    {
      id: "RX-20250110-002",
      doctor: "Dr. Michael Chen", 
      date: "2025-01-10",
      medications: ["Antibiotics", "Cough Syrup"],
      status: "completed"
    },
    {
      id: "RX-20250105-003",
      doctor: "Dr. Emily Davis",
      date: "2025-01-05", 
      medications: ["Blood Pressure Medicine"],
      status: "active"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const handleDownload = (prescriptionId: string) => {
    // Mock download functionality
    console.log(`Downloading prescription: ${prescriptionId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Digital Prescriptions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {prescriptions.map((prescription) => (
            <div key={prescription.id} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium">{prescription.id}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <User className="w-4 h-4" />
                    <span>{prescription.doctor}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(prescription.status)}>
                    {prescription.status}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownload(prescription.id)}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
              
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Medications:</p>
                <p>{prescription.medications.join(', ')}</p>
              </div>
              
              <div className="text-xs text-muted-foreground mt-2">
                Issued on {prescription.date}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PrescriptionsList;