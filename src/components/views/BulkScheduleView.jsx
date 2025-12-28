import React, { useState, useEffect } from 'react';
import { Calendar, Users, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';

const BulkScheduleView = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [filterType, setFilterType] = useState('class'); // 'class' or 'teacher'
  const [filterValue, setFilterValue] = useState('');
  const [availableFilters, setAvailableFilters] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [config, setConfig] = useState({
    duration: 15,
    startDate: new Date().toISOString().split('T')[0],
    daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    type: 'calls', // 'calls' or 'meetings'
  });
  const [previewSchedule, setPreviewSchedule] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadFilterOptions();
  }, [filterType]);

  const loadFilterOptions = async () => {
    const { data } = await supabase.from('students').select(filterType);
    const uniqueOptions = [...new Set(data.map(item => item[filterType]))].filter(Boolean).sort();
    setAvailableFilters(uniqueOptions);
  };

  const handleSearchStudents = async () => {
    if (!filterValue) return;
    
    const { data, error } = await supabase
      .from('students')
      .select('id, name, class, teacher')
      .eq(filterType, filterValue);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch students' });
    } else {
      setSelectedStudents(data.map(s => ({ ...s, selected: true })));
      setStep(2);
    }
  };

  const generateSchedule = async () => {
    setIsProcessing(true);
    try {
      // 1. Get Time Slots
      const { data: slots } = await supabase
        .from('time_slots')
        .select('*')
        .eq('type', config.type)
        .order('start_time');

      if (!slots || slots.length === 0) {
        toast({ variant: 'destructive', title: 'No Slots', description: `No time slots configured for ${config.type}` });
        setIsProcessing(false);
        return;
      }

      // 2. Generate Schedule
      let currentDate = new Date(config.startDate);
      const schedule = [];
      const studentsToSchedule = selectedStudents.filter(s => s.selected);
      let studentIndex = 0;

      // Limit loop to prevent infinite runs (e.g., 30 days)
      for (let i = 0; i < 30 && studentIndex < studentsToSchedule.length; i++) {
        const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
        
        if (config.daysOfWeek.includes(dayName)) {
          const daySlots = slots.filter(s => s.day_of_week === dayName);
          
          for (const slot of daySlots) {
            let slotTime = new Date(`${currentDate.toISOString().split('T')[0]}T${slot.start_time}`);
            const endTime = new Date(`${currentDate.toISOString().split('T')[0]}T${slot.end_time}`);

            while (slotTime < endTime && studentIndex < studentsToSchedule.length) {
              // Check if we can fit the appointment
              const proposedEnd = new Date(slotTime.getTime() + config.duration * 60000);
              
              if (proposedEnd <= endTime) {
                schedule.push({
                  student: studentsToSchedule[studentIndex],
                  date: slotTime.toISOString().split('T')[0],
                  time: slotTime.toTimeString().slice(0, 5),
                  endTime: proposedEnd.toTimeString().slice(0, 5)
                });
                
                studentIndex++;
                slotTime = proposedEnd;
              } else {
                break; // Move to next slot
              }
            }
          }
        }
        
        // Next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setPreviewSchedule(schedule);
      setStep(3);
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error', description: 'Scheduling failed' });
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmSchedule = async () => {
    setIsProcessing(true);
    try {
      const inserts = previewSchedule.map(item => {
        if (config.type === 'calls') {
          return {
            student_id: item.student.id,
            contact_person: 'Parent/Guardian', // Default
            phone_number: 'Pending', // Would fetch from student details ideally
            follow_up_date: item.date,
            notes: `Scheduled Bulk Call for ${item.date} at ${item.time}`,
            completed: false
          };
        } else {
          const startDateTime = new Date(`${item.date}T${item.time}`).toISOString();
          return {
            student_id: item.student.id,
            title: `Scheduled Meeting: ${item.student.name}`,
            description: 'Bulk scheduled meeting',
            meeting_date: startDateTime,
            duration: config.duration,
            status: 'scheduled'
          };
        }
      });

      const table = config.type === 'calls' ? 'call_logs' : 'meetings';
      const { error } = await supabase.from(table).insert(inserts);

      if (error) throw error;

      toast({ title: 'Success', description: `Successfully scheduled ${inserts.length} ${config.type}` });
      setStep(1);
      setSelectedStudents([]);
      setPreviewSchedule([]);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save schedule' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Bulk Scheduling</h2>
        <p className="text-slate-600 mt-1">Auto-schedule multiple calls or meetings efficiently</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        {step === 1 && (
          <div className="space-y-4 max-w-lg">
            <h3 className="text-xl font-semibold">Step 1: Select Students</h3>
            <div>
              <Label>Filter By</Label>
              <div className="flex gap-4 mt-2 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={filterType === 'class'} onChange={() => setFilterType('class')} /> Class
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={filterType === 'teacher'} onChange={() => setFilterType('teacher')} /> Teacher
                </label>
              </div>
              <select
                className="w-full px-3 py-2 border rounded-lg"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
              >
                <option value="">Select {filterType}...</option>
                {availableFilters.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <Button onClick={handleSearchStudents} disabled={!filterValue} className="w-full">Next</Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Step 2: Configure Schedule</h3>
              <span className="text-sm text-slate-500">{selectedStudents.filter(s => s.selected).length} students selected</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Schedule Type</Label>
                  <select 
                    className="w-full px-3 py-2 border rounded-lg mt-1"
                    value={config.type}
                    onChange={(e) => setConfig({...config, type: e.target.value})}
                  >
                    <option value="calls">Phone Calls</option>
                    <option value="meetings">Meetings</option>
                  </select>
                </div>
                <div>
                  <Label>Duration (minutes)</Label>
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 border rounded-lg mt-1"
                    value={config.duration}
                    onChange={(e) => setConfig({...config, duration: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Start Date</Label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 border rounded-lg mt-1"
                    value={config.startDate}
                    onChange={(e) => setConfig({...config, startDate: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Allowed Days</Label>
                <div className="space-y-2 border rounded-lg p-3 bg-slate-50">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <label key={day} className="flex items-center gap-2">
                      <input 
                        type="checkbox"
                        checked={config.daysOfWeek.includes(day)}
                        onChange={(e) => {
                          const newDays = e.target.checked
                            ? [...config.daysOfWeek, day]
                            : config.daysOfWeek.filter(d => d !== day);
                          setConfig({...config, daysOfWeek: newDays});
                        }}
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={generateSchedule} disabled={isProcessing}>
                {isProcessing ? 'Calculating...' : 'Preview Schedule'}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Step 3: Preview & Confirm</h3>
            
            <div className="bg-slate-50 rounded-lg p-4 max-h-96 overflow-y-auto border">
              {previewSchedule.length === 0 ? (
                <p className="text-red-500">Could not fit any students into the available slots.</p>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-100 sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Time</th>
                      <th className="px-3 py-2">Student</th>
                      <th className="px-3 py-2">Class</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {previewSchedule.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 font-medium">{item.date} ({new Date(item.date).toLocaleDateString('en-US', {weekday: 'short'})})</td>
                        <td className="px-3 py-2">{item.time} - {item.endTime}</td>
                        <td className="px-3 py-2">{item.student.name}</td>
                        <td className="px-3 py-2 text-slate-500">{item.student.class}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700">
              <p><strong>Summary:</strong> Scheduled {previewSchedule.length} of {selectedStudents.filter(s => s.selected).length} selected students.</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)}>Adjust Configuration</Button>
              <Button onClick={confirmSchedule} disabled={previewSchedule.length === 0 || isProcessing} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="mr-2 h-4 w-4" /> Confirm & Save
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkScheduleView;