import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { format, addDays, isSameDay, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Trash2, 
  Save, 
  Copy, 
  CheckCircle2,
  Settings,
  Timer,
  Users,
  X,
  ChevronLeft,
  ChevronRight
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
  const [dateAvailability, setDateAvailability] = useState<Record<string, DateAvailability>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showQuickAdd, setShowQuickAdd] = useState(false);

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

  const removeDate = (dateKey: string) => {
    setDateAvailability(prev => {
      const updated = { ...prev };
      delete updated[dateKey];
      return updated;
    });
    setHasChanges(true);
  };

  const addNewDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    updateDateAvailability(dateKey, {
      slots: [{
        start_time: '09:00',
        end_time: '17:00',
        break_duration: 15,
        max_appointments: 8
      }],
      is_active: true
    });
    setSelectedDate(date);
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
  };

  const getTotalHours = (slots: TimeSlot[]) => {
    return slots.reduce((total: number, slot: TimeSlot) => {
      const start = new Date(`2000-01-01T${slot.start_time}`);
      const end = new Date(`2000-01-01T${slot.end_time}`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return total + hours;
    }, 0);
  };

  const formatTime12Hour = (time24: string) => {
    const [hours, minutes] = time24.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDateIndian = (date: Date) => {
    return format(date, 'dd-MM-yy');
  };

  const quickAddOptions = [
    { label: 'Morning (9 AM - 12 PM)', start: '09:00', end: '12:00' },
    { label: 'Afternoon (2 PM - 6 PM)', start: '14:00', end: '18:00' },
    { label: 'Full Day (9 AM - 6 PM)', start: '09:00', end: '18:00' },
    { label: 'Evening (6 PM - 9 PM)', start: '18:00', end: '21:00' }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Modern Header */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Manage Availability
            </h1>
            <p className="text-muted-foreground text-lg">
              Set your consultation hours and manage your schedule
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                <Timer className="h-4 w-4" />
                <span className="text-sm font-medium">Unsaved changes</span>
              </div>
            )}
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || isLoading}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-700">Active Dates</p>
                  <p className="text-3xl font-bold text-green-900">
                    {Object.values(dateAvailability).filter(d => d.is_active).length}
                  </p>
                </div>
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-700">Total Hours</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {Object.values(dateAvailability).reduce((total, date) => 
                      total + getTotalHours(date.slots), 0
                    ).toFixed(1)}h
                  </p>
                </div>
                <Clock className="h-10 w-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-violet-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-purple-700">Total Slots</p>
                  <p className="text-3xl font-bold text-purple-900">
                    {Object.values(dateAvailability).reduce((total: number, date: DateAvailability) => 
                      total + date.slots.reduce((dateTotal: number, slot: TimeSlot) => 
                        dateTotal + (slot.max_appointments || 0), 0
                      ), 0
                    )}
                  </p>
                </div>
                <Users className="h-10 w-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-amber-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-orange-700">Upcoming</p>
                  <p className="text-3xl font-bold text-orange-900">
                    {Object.keys(dateAvailability).filter(date => 
                      new Date(date) > new Date() && dateAvailability[date].is_active
                    ).length}
                  </p>
                </div>
                <CalendarIcon className="h-10 w-10 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Calendar Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Selection */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Select Dates
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQuickAdd(!showQuickAdd)}
                  className="text-xs"
                >
                  Quick Add
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date && !isBefore(date, new Date())) {
                    setSelectedDate(date);
                  }
                }}
                disabled={(date) => isBefore(date, new Date())}
                className="rounded-md border-0"
                modifiers={{
                  available: Object.keys(dateAvailability).map(date => new Date(date))
                }}
                modifiersStyles={{
                  available: { backgroundColor: 'rgb(34 197 94 / 0.1)', color: 'rgb(22 163 74)' }
                }}
              />
              
              {selectedDate && (
                <div className="space-y-3 pt-4 border-t">
                  <p className="text-sm font-medium">
                    {format(selectedDate, 'EEEE, d MMMM')} ({formatDateIndian(selectedDate)})
                  </p>
                  <Button
                    onClick={() => addNewDate(selectedDate)}
                    className="w-full"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Availability
                  </Button>
                </div>
              )}

              {/* Quick Add Options */}
              {showQuickAdd && selectedDate && (
                <div className="space-y-2 pt-4 border-t">
                  <p className="text-sm font-medium text-muted-foreground">Quick Templates</p>
                  {quickAddOptions.map((option) => (
                    <Button
                      key={option.label}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => {
                        const dateKey = format(selectedDate, 'yyyy-MM-dd');
                        updateDateAvailability(dateKey, {
                          slots: [{
                            start_time: option.start,
                            end_time: option.end,
                            break_duration: 15,
                            max_appointments: 8
                          }],
                          is_active: true
                        });
                        setShowQuickAdd(false);
                      }}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Availability List */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Your Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {Object.entries(dateAvailability)
                  .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                  .map(([dateKey, dateData]) => {
                  const dateObj = new Date(dateKey);
                  const isPast = isBefore(dateObj, new Date());
                  const totalHours = getTotalHours(dateData.slots);

                  return (
                    <Card key={dateKey} className={`transition-all border ${isPast ? 'opacity-60' : 'hover:shadow-md'}`}>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Date Header */}
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <h3 className="font-semibold text-lg">
                                {format(dateObj, 'EEEE, d MMMM')} ({formatDateIndian(dateObj)})
                              </h3>
                              <div className="flex items-center gap-3">
                                {isPast && (
                                  <Badge variant="secondary" className="text-xs">Past</Badge>
                                )}
                                {dateData.is_active && !isPast && (
                                  <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                                    Available
                                  </Badge>
                                )}
                                {totalHours > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {totalHours.toFixed(1)}h • {dateData.slots.length} slots
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {!isPast && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeDate(dateKey)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>

                          {/* Time Slots */}
                          <div className="space-y-3">
                            {dateData.slots.map((slot, index) => (
                              <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                <div className="flex items-center gap-4">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  <div className="space-y-1">
                                    <p className="font-medium">
                                      {formatTime12Hour(slot.start_time)} - {formatTime12Hour(slot.end_time)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {slot.max_appointments} appointments • {slot.break_duration}min breaks
                                    </p>
                                  </div>
                                </div>
                                {!isPast && (
                                  <div className="flex items-center gap-2">
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          <Settings className="w-4 h-4" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-80">
                                        <div className="space-y-4">
                                          <h4 className="font-medium">Edit Time Slot</h4>
                                          <div className="grid grid-cols-2 gap-4">
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
                                              <Label className="text-sm">Break (min)</Label>
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
                                              <Label className="text-sm">Max Patients</Label>
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
                                      </PopoverContent>
                                    </Popover>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeTimeSlot(dateKey, index)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))}

                            {!isPast && (
                              <Button
                                variant="outline"
                                onClick={() => addTimeSlot(dateKey)}
                                className="w-full"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Time Slot
                              </Button>
                            )}
                          </div>

                          {/* Notes */}
                          {!isPast && (
                            <div className="pt-2">
                              <Label className="text-sm">Notes (optional)</Label>
                              <Textarea
                                value={dateData.notes || ''}
                                onChange={(e) => updateDateAvailability(dateKey, { notes: e.target.value })}
                                placeholder="Add any special notes for this date..."
                                className="mt-1 resize-none"
                                rows={2}
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {Object.keys(dateAvailability).length === 0 && (
                  <div className="text-center py-12">
                    <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">No availability set</h3>
                    <p className="text-muted-foreground mb-6">
                      Select dates from the calendar to start setting your availability
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Professional Tips */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 text-blue-900 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Best Practices for Healthcare Scheduling
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                Set realistic break durations between appointments (15-30 minutes)
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                Consider buffer time for emergencies and follow-ups
              </li>
            </ul>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                Update availability regularly to reflect your current schedule
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                Use notes to communicate special availability conditions
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}