import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Trash2, 
  Save, 
  Copy, 
  RotateCcw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface TimeSlot {
  start_time: string;
  end_time: string;
  break_duration?: number;
  max_appointments?: number;
}

interface DateAvailability {
  id?: string;
  availability_date: string;
  slots: TimeSlot[];
  is_active: boolean;
  notes?: string;
}

interface AvailabilityCalendarProps {
  availability: any[];
  onSave: (updates: DateAvailability[]) => void;
  isLoading?: boolean;
}

export function AvailabilityCalendar({ availability, onSave, isLoading }: AvailabilityCalendarProps) {
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [dateAvailability, setDateAvailability] = useState<Record<string, DateAvailability>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();

  // Initialize availability from props
  React.useEffect(() => {
    const initialAvailability: Record<string, DateAvailability> = {};
    
    availability.forEach(avail => {
      const dateKey = avail.availability_date;
      if (!initialAvailability[dateKey]) {
        initialAvailability[dateKey] = {
          availability_date: dateKey,
          slots: [],
          is_active: avail.is_active || false,
          notes: ''
        };
      }
      
      initialAvailability[dateKey].slots.push({
        start_time: avail.start_time,
        end_time: avail.end_time,
        break_duration: 15,
        max_appointments: 8
      });
    });
    
    setDateAvailability(initialAvailability);
  }, [availability]);

  const updateDateAvailability = (dateKey: string, updates: Partial<DateAvailability>) => {
    setDateAvailability(prev => ({
      ...prev,
      [dateKey]: { 
        availability_date: dateKey,
        slots: [],
        is_active: false,
        notes: '',
        ...prev[dateKey], 
        ...updates 
      }
    }));
    setHasChanges(true);
  };

  const addTimeSlot = (dateKey: string) => {
    const currentSlots = dateAvailability[dateKey]?.slots || [];
    const newSlot: TimeSlot = {
      start_time: '09:00',
      end_time: '17:00',
      break_duration: 15,
      max_appointments: 8
    };
    
    updateDateAvailability(dateKey, {
      slots: [...currentSlots, newSlot],
      is_active: true
    });
  };

  const removeTimeSlot = (dateKey: string, slotIndex: number) => {
    const currentSlots = dateAvailability[dateKey]?.slots || [];
    const newSlots = currentSlots.filter((_, index) => index !== slotIndex);
    
    updateDateAvailability(dateKey, {
      slots: newSlots,
      is_active: newSlots.length > 0
    });
  };

  const updateTimeSlot = (dateKey: string, slotIndex: number, updates: Partial<TimeSlot>) => {
    const currentSlots = dateAvailability[dateKey]?.slots || [];
    const newSlots = currentSlots.map((slot, index) => 
      index === slotIndex ? { ...slot, ...updates } : slot
    );
    
    updateDateAvailability(dateKey, { slots: newSlots });
  };

  const copyToNewDate = (fromDateKey: string) => {
    if (!selectedDate) return;
    
    const toDateKey = format(selectedDate, 'yyyy-MM-dd');
    const currentDate = dateAvailability[fromDateKey];
    
    if (currentDate && currentDate.slots.length > 0) {
      updateDateAvailability(toDateKey, {
        slots: [...currentDate.slots],
        is_active: true
      });
    }
  };

  const removeDate = (dateKey: string) => {
    setDateAvailability(prev => {
      const updated = { ...prev };
      delete updated[dateKey];
      return updated;
    });
    setHasChanges(true);
  };

  const addNewDate = () => {
    if (!selectedDate) return;
    
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    updateDateAvailability(dateKey, {
      slots: [],
      is_active: false
    });
    setEditingDate(dateKey);
  };

  const handleSave = () => {
    const updates = Object.values(dateAvailability).map(date => ({
      availability_date: date.availability_date,
      slots: date.slots,
      is_active: date.is_active && date.slots.length > 0,
      notes: date.notes
    }));
    
    onSave(updates);
    setHasChanges(false);
    setEditingDate(null);
  };

  const getTotalHours = (slots: TimeSlot[]) => {
    return slots.reduce((total: number, slot: TimeSlot) => {
      const start = new Date(`2000-01-01T${slot.start_time}`);
      const end = new Date(`2000-01-01T${slot.end_time}`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return total + hours;
    }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="w-8 h-8" />
            Manage Availability
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure your weekly schedule and consultation slots
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <div className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Unsaved changes</span>
            </div>
          )}
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Dates</p>
                <p className="text-2xl font-bold">
                  {Object.values(dateAvailability).filter(d => d.is_active).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">
                  {Object.values(dateAvailability).reduce((total, date) => 
                    total + getTotalHours(date.slots), 0
                  ).toFixed(1)}h
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Consultation Slots</p>
                <p className="text-2xl font-bold">
                  {Object.values(dateAvailability).reduce((total: number, date: DateAvailability) => 
                    total + date.slots.reduce((dateTotal: number, slot: TimeSlot) => 
                      dateTotal + (slot.max_appointments || 0), 0
                    ), 0
                  )}
                </p>
              </div>
              <CalendarIcon className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Date */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <Button onClick={addNewDate} disabled={!selectedDate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Availability
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Date-Based Availability Configuration */}
      <div className="space-y-4">
        {Object.entries(dateAvailability)
          .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
          .map(([dateKey, dateData]) => {
          const isEditing = editingDate === dateKey;
          const totalHours = getTotalHours(dateData.slots);
          const dateObj = new Date(dateKey);
          const isPast = dateObj < new Date();

          return (
            <Card key={dateKey} className={`transition-all ${isEditing ? 'ring-2 ring-primary' : ''} ${isPast ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-xl">
                      {format(dateObj, 'EEEE, MMMM d, yyyy')}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {isPast && (
                        <Badge variant="secondary" className="text-muted-foreground">
                          Past
                        </Badge>
                      )}
                      {dateData.is_active && !isPast && (
                        <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">
                          Available
                        </Badge>
                      )}
                      {totalHours > 0 && (
                        <Badge variant="secondary">
                          {totalHours.toFixed(1)}h • {dateData.slots.length} slots
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isPast && (
                      <>
                        {!isEditing ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingDate(dateKey)}
                          >
                            Edit
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingDate(null)}
                          >
                            Done
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeDate(dateKey)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!isEditing || isPast ? (
                  <div>
                    {dateData.slots.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-4">
                        No slots configured
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {dateData.slots.map((slot, index) => (
                          <div key={index} className="flex items-center gap-4 text-sm">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>{slot.start_time} - {slot.end_time}</span>
                            <span className="text-muted-foreground">
                              • {slot.max_appointments} appointments
                            </span>
                            {slot.break_duration && (
                              <span className="text-muted-foreground">
                                • {slot.break_duration}min breaks
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Time Slots */}
                    {dateData.slots.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">
                          No time slots configured for this date
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => addTimeSlot(dateKey)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Time Slot
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {dateData.slots.map((slot, index) => (
                          <div key={index} className="p-4 border rounded-lg bg-muted/30">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-medium">Slot {index + 1}</h4>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeTimeSlot(dateKey, index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <Label className="text-sm">Start Time</Label>
                                <Input
                                  type="time"
                                  value={slot.start_time}
                                  onChange={(e) => updateTimeSlot(dateKey, index, { start_time: e.target.value })}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm">End Time</Label>
                                <Input
                                  type="time"
                                  value={slot.end_time}
                                  onChange={(e) => updateTimeSlot(dateKey, index, { end_time: e.target.value })}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm">Break Duration (min)</Label>
                                <Input
                                  type="number"
                                  value={slot.break_duration || 15}
                                  onChange={(e) => updateTimeSlot(dateKey, index, { break_duration: parseInt(e.target.value) })}
                                  className="mt-1"
                                  min="5"
                                  max="60"
                                />
                              </div>
                              <div>
                                <Label className="text-sm">Max Appointments</Label>
                                <Input
                                  type="number"
                                  value={slot.max_appointments || 8}
                                  onChange={(e) => updateTimeSlot(dateKey, index, { max_appointments: parseInt(e.target.value) })}
                                  className="mt-1"
                                  min="1"
                                  max="20"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addTimeSlot(dateKey)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Another Slot
                          </Button>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Copy className="w-4 h-4 mr-2" />
                                Copy to Date
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => {
                                  setSelectedDate(date);
                                  if (date) {
                                    copyToNewDate(dateKey);
                                  }
                                }}
                                disabled={(date) => date < new Date() || date.toDateString() === dateObj.toDateString()}
                                initialFocus
                                className="p-3 pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <Label className="text-sm">Notes (optional)</Label>
                      <Textarea
                        value={dateData.notes || ''}
                        onChange={(e) => updateDateAvailability(dateKey, { notes: e.target.value })}
                        placeholder="Add any special notes for this date..."
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        
        {Object.keys(dateAvailability).length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No availability set</h3>
              <p className="text-muted-foreground mb-4">
                Select a date above to start setting your availability
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            Best Practices
          </h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Set realistic break durations between appointments (15-30 minutes recommended)</li>
            <li>Consider buffer time for emergencies and follow-ups</li>
            <li>Update availability regularly to reflect your current schedule</li>
            <li>Use notes to communicate special availability conditions</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}