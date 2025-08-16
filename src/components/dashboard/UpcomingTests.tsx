import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Calendar, Clock, MapPin } from 'lucide-react';

const UpcomingTests = () => {
  const tests = [
    {
      id: "TST-001",
      name: "Complete Blood Count (CBC)",
      date: "2025-01-18",
      time: "09:00 AM",
      type: "Home Collection",
      status: "confirmed"
    },
    {
      id: "TST-002", 
      name: "Lipid Profile",
      date: "2025-01-20",
      time: "10:30 AM", 
      type: "Lab Visit",
      status: "pending"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5" />
          Upcoming Tests
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tests.map((test) => (
            <div key={test.id} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium">{test.name}</h4>
                <Badge className={getStatusColor(test.status)}>
                  {test.status}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{test.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{test.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{test.type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingTests;