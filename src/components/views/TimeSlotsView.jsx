import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';

const TimeSlotsView = () => {
  const { toast } = useToast();
  const [slots, setSlots] = useState([]);
  const [newSlot, setNewSlot] = useState({
    day_of_week: 'Monday',
    type: 'calls',
    start_time: '09:00',
    end_time: '10:00',
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    loadSlots();
  }, []);

  const loadSlots = async () => {
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .order('day_of_week')
      .order('start_time');

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load time slots',
      });
    } else {
      setSlots(data || []);
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();

    if (newSlot.start_time >= newSlot.end_time) {
      toast({
        variant: 'destructive',
        title: 'Invalid Time',
        description: 'Start time must be before end time',
      });
      return;
    }

    const { error } = await supabase.from('time_slots').insert([newSlot]);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add time slot',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Time slot added successfully',
      });
      loadSlots();
    }
  };

  const handleDeleteSlot = async (id) => {
    const { error } = await supabase.from('time_slots').delete().eq('id', id);
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete slot',
      });
    } else {
      loadSlots();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Time Slots</h2>
        <p className="text-slate-600 mt-1">Manage availability for calls and meetings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Add New Slot</h3>
            <form onSubmit={handleAddSlot} className="space-y-4">
              <div>
                <Label htmlFor="day">Day</Label>
                <select
                  id="day"
                  value={newSlot.day_of_week}
                  onChange={(e) => setNewSlot({ ...newSlot, day_of_week: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg mt-1"
                >
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={newSlot.type}
                  onChange={(e) => setNewSlot({ ...newSlot, type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg mt-1"
                >
                  <option value="calls">Calls</option>
                  <option value="meetings">Meetings</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start">Start Time</Label>
                  <input
                    type="time"
                    id="start"
                    value={newSlot.start_time}
                    onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="end">End Time</Label>
                  <input
                    type="time"
                    id="end"
                    value={newSlot.end_time}
                    onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg mt-1"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-blue-600">
                <Plus size={16} className="mr-2" /> Add Slot
              </Button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Weekly Schedule</h3>
            <div className="space-y-6">
              {days.map(day => {
                const daySlots = slots.filter(s => s.day_of_week === day);
                if (daySlots.length === 0) return null;

                return (
                  <div key={day} className="border-b last:border-0 pb-4 last:pb-0">
                    <h4 className="font-medium text-slate-700 mb-2">{day}</h4>
                    <div className="space-y-2">
                      {daySlots.map(slot => (
                        <div key={slot.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Clock size={16} className="text-slate-400" />
                            <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${
                              slot.type === 'calls' ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'
                            }`}>
                              {slot.type}
                            </span>
                            <span className="text-sm text-slate-600">
                              {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {slots.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  No time slots configured yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeSlotsView;