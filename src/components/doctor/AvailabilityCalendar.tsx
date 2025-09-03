import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, 
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

interface DayAvailability {
  id?: string;
  day_of_week: number;
  slots: TimeSlot[];
  is_active: boolean;
  notes?: string;
}

interface AvailabilityCalendarProps {
  availability: any[];
  onSave: (updates: DayAvailability[]) => void;
  isLoading?: boolean;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
  { value: 0, label: 'Sunday', short: 'Sun' },
];

export function AvailabilityCalendar({ availability, onSave, isLoading }: AvailabilityCalendarProps) {
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [dayAvailability, setDayAvailability] = useState<Record<number, DayAvailability>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize availability from props
  React.useEffect(() => {
    const initialAvailability: Record<number, DayAvailability> = {};
    
    DAYS_OF_WEEK.forEach(day => {
      const existingAvail = availability.find(a => a.day_of_week === day.value);
      initialAvailability[day.value] = {
        day_of_week: day.value,
        slots: existingAvail ? [{
          start_time: existingAvail.start_time,
          end_time: existingAvail.end_time,
          break_duration: 15,
          max_appointments: 8
        }] : [],
        is_active: existingAvail?.is_active || false,
        notes: ''
      };
    });
    
    setDayAvailability(initialAvailability);
  }, [availability]);

  const updateDayAvailability = (dayValue: number, updates: Partial<DayAvailability>) => {
    setDayAvailability(prev => ({
      ...prev,
      [dayValue]: { ...prev[dayValue], ...updates }
    }));
    setHasChanges(true);
  };

  const addTimeSlot = (dayValue: number) => {
    const currentSlots = dayAvailability[dayValue]?.slots || [];
    const newSlot: TimeSlot = {
      start_time: '09:00',
      end_time: '17:00',
      break_duration: 15,
      max_appointments: 8
    };
    
    updateDayAvailability(dayValue, {
      slots: [...currentSlots, newSlot],
      is_active: true
    });
  };

  const removeTimeSlot = (dayValue: number, slotIndex: number) => {
    const currentSlots = dayAvailability[dayValue]?.slots || [];
    const newSlots = currentSlots.filter((_, index) => index !== slotIndex);
    
    updateDayAvailability(dayValue, {
      slots: newSlots,
      is_active: newSlots.length > 0
    });
  };

  const updateTimeSlot = (dayValue: number, slotIndex: number, updates: Partial<TimeSlot>) => {
    const currentSlots = dayAvailability[dayValue]?.slots || [];
    const newSlots = currentSlots.map((slot, index) => 
      index === slotIndex ? { ...slot, ...updates } : slot
    );
    
    updateDayAvailability(dayValue, { slots: newSlots });
  };

  const copyToNextDay = (dayValue: number) => {
    const nextDayValue = dayValue === 0 ? 1 : (dayValue + 1) % 7;
    const currentDay = dayAvailability[dayValue];
    
    if (currentDay && currentDay.slots.length > 0) {
      updateDayAvailability(nextDayValue, {
        slots: [...currentDay.slots],
        is_active: true
      });
    }
  };

  const resetDay = (dayValue: number) => {
    updateDayAvailability(dayValue, {
      slots: [],
      is_active: false,
      notes: ''
    });
  };

  const handleSave = () => {
    const updates = Object.values(dayAvailability).map(day => ({
      day_of_week: day.day_of_week,
      slots: day.slots,
      is_active: day.is_active && day.slots.length > 0,
      notes: day.notes
    }));
    
    onSave(updates);
    setHasChanges(false);
    setEditingDay(null);
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
                <p className="text-sm text-muted-foreground">Active Days</p>
                <p className="text-2xl font-bold">
                  {Object.values(dayAvailability).filter(d => d.is_active).length}
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
                <p className="text-sm text-muted-foreground">Weekly Hours</p>
                <p className="text-2xl font-bold">
                  {Object.values(dayAvailability).reduce((total, day) => 
                    total + getTotalHours(day.slots), 0
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
                <p className="text-sm text-muted-foreground">Max Consultations/Week</p>
                <p className="text-2xl font-bold">
                  {Object.values(dayAvailability).reduce((total, day) => 
                    total + day.slots.reduce((dayTotal, slot) => 
                      dayTotal + (slot.max_appointments || 0), 0
                    ), 0
                  )}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Days Configuration */}
      <div className="space-y-4">
        {DAYS_OF_WEEK.map(day => {
          const dayData = dayAvailability[day.value] || { slots: [], is_active: false };
          const isEditing = editingDay === day.value;
          const totalHours = getTotalHours(dayData.slots);

          return (
            <Card key={day.value} className={`transition-all ${isEditing ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-xl">{day.label}</CardTitle>
                    <div className="flex items-center gap-2">
                      {dayData.is_active && (
                        <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">
                          Available
                        </Badge>
                      )}
                      {totalHours > 0 && (
                        <Badge variant="secondary">
                          {totalHours.toFixed(1)}h • {dayData.slots.reduce((total, slot) => total + (slot.max_appointments || 0), 0)} slots
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditing ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingDay(day.value)}
                      >
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingDay(null)}
                        >
                          Done
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!isEditing ? (
                  <div>
                    {dayData.slots.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-4">
                        Not available
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {dayData.slots.map((slot, index) => (
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
                    {/* Active Toggle */}
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={dayData.is_active}
                        onCheckedChange={(checked) => 
                          updateDayAvailability(day.value, { is_active: checked })
                        }
                      />
                      <Label>Available on {day.label}</Label>
                    </div>

                    {/* Time Slots */}
                    {dayData.slots.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">
                          No time slots configured for {day.label}
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => addTimeSlot(day.value)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Time Slot
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {dayData.slots.map((slot, index) => (
                          <div key={index} className="p-4 border rounded-lg bg-muted/30">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-medium">Slot {index + 1}</h4>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeTimeSlot(day.value, index)}
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
                                  onChange={(e) => updateTimeSlot(day.value, index, { start_time: e.target.value })}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm">End Time</Label>
                                <Input
                                  type="time"
                                  value={slot.end_time}
                                  onChange={(e) => updateTimeSlot(day.value, index, { end_time: e.target.value })}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm">Break Duration (min)</Label>
                                <Input
                                  type="number"
                                  value={slot.break_duration || 15}
                                  onChange={(e) => updateTimeSlot(day.value, index, { break_duration: parseInt(e.target.value) })}
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
                                  onChange={(e) => updateTimeSlot(day.value, index, { max_appointments: parseInt(e.target.value) })}
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
                            onClick={() => addTimeSlot(day.value)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Another Slot
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToNextDay(day.value)}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy to Next Day
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resetDay(day.value)}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Reset
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <Label className="text-sm">Notes (optional)</Label>
                    <Textarea
                      value={(dayData as any).notes || ''}
                      onChange={(e) => updateDayAvailability(day.value, { notes: e.target.value })}
                      placeholder="Add any special notes for this day..."
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