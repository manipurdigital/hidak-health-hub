
import React, { useState } from 'react';
import { Calendar, MapPin, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AddressDialog } from '@/components/AddressDialog';
import { useToast } from '@/hooks/use-toast';

interface SlotPickerProps {
  labTest: any;
  addresses: any[];
  selectedAddress: string;
  onAddressChange: (addressId: string) => void;
  onSlotSelected: (slot: { date: string; notes?: string }) => void;
  onBack: () => void;
}

export function SlotPicker({ 
  labTest, 
  addresses, 
  selectedAddress, 
  onAddressChange, 
  onSlotSelected,
  onBack 
}: SlotPickerProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const { toast } = useToast();

  // Generate next 7 days
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        date: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        })
      });
    }
    return dates;
  };

  const dates = generateDates();
  const defaultAddress = addresses.find(addr => addr.is_default) || addresses[0];

  // Set default address if not selected
  React.useEffect(() => {
    if (defaultAddress && !selectedAddress) {
      onAddressChange(defaultAddress.id);
    }
  }, [defaultAddress, selectedAddress, onAddressChange]);

  const handleContinue = () => {
    if (!selectedAddress) {
      toast({
        title: "Address Required",
        description: "Please select a collection address",
        variant: "destructive"
      });
      return;
    }

    if (!selectedDate) {
      toast({
        title: "Date Required", 
        description: "Please select a collection date",
        variant: "destructive"
      });
      return;
    }

    onSlotSelected({
      date: selectedDate,
      notes: notes.trim() || undefined
    });
  };

  const handleEditAddress = (address: any) => {
    setEditingAddress(address);
    setShowAddressDialog(true);
  };

  const handleDeleteAddress = (addressId: string) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      console.log('Delete address:', addressId);
    }
  };

  const handleDialogClose = () => {
    setShowAddressDialog(false);
    setEditingAddress(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Collection Address */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Home Sample Collection Address
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAddressDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {addresses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No saved addresses found.</p>
              <Button onClick={() => setShowAddressDialog(true)}>
                Add Collection Address
              </Button>
            </div>
          ) : (
            <RadioGroup value={selectedAddress} onValueChange={onAddressChange}>
              <div className="space-y-4">
                {addresses.map((address) => (
                  <div key={address.id} className="flex items-start space-x-3">
                    <RadioGroupItem value={address.id} id={address.id} />
                    <Label htmlFor={address.id} className="flex-1 cursor-pointer">
                      <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{address.name}</span>
                            <Badge variant="outline">{address.type}</Badge>
                            {address.is_default && (
                              <Badge variant="secondary">Default</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                handleEditAddress(address);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                handleDeleteAddress(address.id);
                              }}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              disabled={false}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {address.address_line_1}, {address.address_line_2 && `${address.address_line_2}, `}
                          {address.city}, {address.state} - {address.postal_code}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Phone: {address.phone}
                        </p>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}
        </CardContent>
      </Card>

      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Select Collection Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {dates.map((date) => (
              <Button
                key={date.date}
                variant={selectedDate === date.date ? "default" : "outline"}
                className="h-16 flex flex-col items-center"
                onClick={() => setSelectedDate(date.date)}
              >
                <span className="text-xs">{date.label.split(' ')[0]}</span>
                <span className="text-sm font-semibold">{date.label.split(' ')[2]}</span>
                <span className="text-xs">{date.label.split(' ')[1]}</span>
              </Button>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Our lab team will call you to confirm the exact collection time on your selected date. 
              Sample collection is typically available between 6:00 AM to 6:00 PM.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Special Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Special Instructions (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Any special instructions for our phlebotomist (e.g., gate access, landmark, specific floor, preferred time window, etc.)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
          <p className="text-sm text-muted-foreground mt-2">
            Help our team locate your address easily and prepare for the visit
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back to Details
        </Button>
        <Button onClick={handleContinue} className="flex-1" disabled={!selectedAddress || !selectedDate}>
          Continue to Review
        </Button>
      </div>

      <AddressDialog 
        isOpen={showAddressDialog} 
        onClose={handleDialogClose}
        editingAddress={editingAddress}
      />
    </div>
  );
}
