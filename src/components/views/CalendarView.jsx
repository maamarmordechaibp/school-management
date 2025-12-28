import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus, 
  MoreHorizontal, AlignJustify, Columns, LayoutGrid 
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, 
  eachDayOfInterval, isSameMonth, isSameDay, addDays, addMonths, 
  addWeeks, startOfDay, isToday, parseISO, getHours, setHours, setMinutes 
} from 'date-fns';

import MeetingModal from '@/components/modals/MeetingModal';
import StudentProfileModal from '@/components/modals/StudentProfileModal';

const CalendarView = () => {
  const { toast } = useToast();
  
  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week' | 'day'
  const [events, setEvents] = useState([]);
  const [students, setStudents] = useState([]);
  
  // Interaction State
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newMeetingData, setNewMeetingData] = useState(null); // { date, time }
  
  const [selectedStudentId, setSelectedStudentId] = useState(null); // For profile view

  useEffect(() => {
    fetchEvents();
    fetchStudents();
  }, [currentDate, viewMode]);

  const fetchStudents = async () => {
    const { data } = await supabase.from('students').select('id, name, class');
    setStudents(data || []);
  };

  const fetchEvents = async () => {
    let start, end;

    if (viewMode === 'month') {
      start = startOfMonth(currentDate);
      end = endOfMonth(currentDate);
      // Pad to full weeks for grid
      start = startOfWeek(start);
      end = endOfWeek(end);
    } else if (viewMode === 'week') {
      start = startOfWeek(currentDate);
      end = endOfWeek(currentDate);
    } else {
      start = startOfDay(currentDate);
      end = addDays(start, 1);
    }

    const { data, error } = await supabase
      .from('meetings')
      .select('*, students(name, class)')
      .gte('meeting_date', start.toISOString())
      .lte('meeting_date', end.toISOString());

    if (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load calendar events' });
    } else {
      setEvents(data || []);
    }
  };

  const navigate = (direction) => {
    if (viewMode === 'month') {
      setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : addMonths(prev, -1));
    } else if (viewMode === 'week') {
      setCurrentDate(prev => direction === 'next' ? addWeeks(prev, 1) : addWeeks(prev, -1));
    } else {
      setCurrentDate(prev => direction === 'next' ? addDays(prev, 1) : addDays(prev, -1));
    }
  };

  const handleSlotClick = (day, hour = 9) => {
    // Default to 9 AM if month view click, or specific hour for week/day view
    const dateStr = format(day, 'yyyy-MM-dd');
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    
    // Check if slot already has event? No, allow multiple.
    
    setSelectedEvent(null);
    setNewMeetingData({
      meeting_date: dateStr,
      meeting_time: timeStr
    });
    setIsMeetingModalOpen(true);
  };

  const handleEventClick = (e, event) => {
    e.stopPropagation();
    // Show details via profile or meeting modal
    // Let's open student profile directly if quick view, or meeting details.
    // User asked: "show the student details"
    
    // We'll show a small dialog or just open MeetingModal in edit mode?
    // Let's use Profile modal since "student details" was requested, 
    // but maybe we want to edit the meeting too. 
    // Let's open Profile. But we also need a way to edit meeting.
    // Let's open MeetingModal, which links to student.
    
    setSelectedEvent(event);
    setNewMeetingData(null);
    setIsMeetingModalOpen(true);
  };

  // --- Render Helpers ---

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Header
    const header = (
       <div className="grid grid-cols-7 mb-2 text-center text-sm font-semibold text-slate-500">
          {weekDays.map(d => <div key={d} className="py-2">{d}</div>)}
       </div>
    );

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        const dayEvents = events.filter(e => isSameDay(parseISO(e.meeting_date), day));
        
        days.push(
          <div
            key={day}
            className={`min-h-[120px] bg-white border border-slate-100 p-2 relative hover:bg-slate-50 transition-colors cursor-pointer flex flex-col gap-1 ${
              !isSameMonth(day, monthStart) ? "text-slate-300 bg-slate-50/50" : "text-slate-700"
            } ${isToday(day) ? "bg-blue-50/30 border-blue-200" : ""}`}
            onClick={() => handleSlotClick(cloneDay)}
          >
            <div className={`text-right text-sm font-medium ${isToday(day) ? "text-blue-600" : ""}`}>
               {formattedDate}
            </div>
            
            <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[100px] scrollbar-hide">
               {dayEvents.map(ev => (
                  <div 
                    key={ev.id}
                    onClick={(e) => handleEventClick(e, ev)}
                    className={`text-xs px-2 py-1 rounded truncate border shadow-sm ${
                        ev.status === 'completed' ? 'bg-green-100 border-green-200 text-green-800' :
                        ev.status === 'cancelled' ? 'bg-red-50 text-red-400 line-through' :
                        'bg-blue-100 border-blue-200 text-blue-800'
                    }`}
                    title={`${format(parseISO(ev.meeting_date), 'h:mm a')} - ${ev.title}`}
                  >
                     <span className="font-semibold mr-1">{format(parseISO(ev.meeting_date), 'h:mm a')}</span>
                     {ev.students?.name || ev.title}
                  </div>
               ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1" key={day}>
          {days}
        </div>
      );
      days = [];
    }
    
    return <div className="bg-slate-100 p-1 rounded-lg shadow-inner">{header}{rows}</div>;
  };

  const renderTimeGrid = (daysToShow) => {
    // daysToShow: array of Date objects
    const hours = Array.from({ length: 13 }, (_, i) => i + 7); // 7 AM to 7 PM (19:00)

    return (
       <div className="flex bg-white border rounded-lg overflow-hidden shadow-sm">
          {/* Time Column */}
          <div className="w-16 flex-shrink-0 border-r bg-slate-50">
             <div className="h-12 border-b"></div> {/* Header spacer */}
             {hours.map(h => (
                <div key={h} className="h-20 border-b text-xs text-slate-500 text-right pr-2 pt-2">
                   {h > 12 ? `${h-12} PM` : `${h} AM`}
                </div>
             ))}
          </div>

          {/* Days Columns */}
          <div className="flex-1 flex overflow-x-auto">
             {daysToShow.map(day => (
                <div key={day.toString()} className="flex-1 min-w-[150px] border-r last:border-r-0">
                   {/* Header */}
                   <div className={`h-12 border-b flex flex-col justify-center items-center ${isToday(day) ? 'bg-blue-50' : 'bg-slate-50'}`}>
                      <span className="text-xs font-semibold text-slate-500 uppercase">{format(day, 'EEE')}</span>
                      <span className={`text-sm font-bold ${isToday(day) ? 'text-blue-600' : 'text-slate-800'}`}>
                         {format(day, 'MMM d')}
                      </span>
                   </div>

                   {/* Slots */}
                   <div className="relative">
                      {hours.map(h => (
                         <div 
                           key={h} 
                           className="h-20 border-b border-slate-100 hover:bg-slate-50 cursor-pointer relative group"
                           onClick={() => handleSlotClick(day, h)}
                         >
                            <div className="hidden group-hover:flex absolute inset-0 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <Plus className="text-blue-300 h-6 w-6" />
                            </div>
                         </div>
                      ))}

                      {/* Events Overlay */}
                      {events.filter(e => isSameDay(parseISO(e.meeting_date), day)).map(ev => {
                         const eventDate = parseISO(ev.meeting_date);
                         const startHour = getHours(eventDate);
                         const startMin = eventDate.getMinutes();
                         // Calculate top position relative to 7 AM start
                         // (Hour - 7) * 80px (height of slot) + (Minutes / 60) * 80px
                         const top = ((startHour - 7) * 80) + ((startMin / 60) * 80);
                         // Height based on duration (default 60 mins if not set)
                         const duration = ev.duration || 60;
                         const height = (duration / 60) * 80;

                         // Only render if within visible range (7am-8pm) roughly
                         if (startHour < 7 || startHour > 19) return null;

                         return (
                            <div
                               key={ev.id}
                               onClick={(e) => handleEventClick(e, ev)}
                               className={`absolute left-1 right-1 rounded p-2 text-xs border shadow-sm cursor-pointer hover:brightness-95 transition-all z-10 overflow-hidden ${
                                 ev.status === 'completed' ? 'bg-green-100 border-green-300 text-green-900' : 
                                 'bg-blue-100 border-blue-300 text-blue-900'
                               }`}
                               style={{ top: `${top}px`, height: `${height}px` }}
                            >
                               <div className="font-bold">{format(eventDate, 'h:mm a')}</div>
                               <div className="truncate font-medium">{ev.students?.name}</div>
                               <div className="truncate text-blue-800/70">{ev.title}</div>
                            </div>
                         );
                      })}
                   </div>
                </div>
             ))}
          </div>
       </div>
    );
  };


  return (
    <div className="space-y-4 h-full flex flex-col">
       {/* Toolbar */}
       <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-4">
             <div className="flex items-center bg-slate-100 rounded-lg p-1">
                <Button variant="ghost" size="icon" onClick={() => navigate('prev')} className="h-8 w-8"><ChevronLeft size={16}/></Button>
                <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())} className="h-8 px-3 text-xs font-semibold">Today</Button>
                <Button variant="ghost" size="icon" onClick={() => navigate('next')} className="h-8 w-8"><ChevronRight size={16}/></Button>
             </div>
             <h2 className="text-xl font-bold text-slate-800 min-w-[200px]">
                {format(currentDate, 'MMMM yyyy')}
             </h2>
          </div>

          <div className="flex gap-2">
             <Tabs value={viewMode} onValueChange={setViewMode} className="w-[300px]">
                <TabsList className="grid w-full grid-cols-3">
                   <TabsTrigger value="month">Month</TabsTrigger>
                   <TabsTrigger value="week">Week</TabsTrigger>
                   <TabsTrigger value="day">Day</TabsTrigger>
                </TabsList>
             </Tabs>
             
             <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsMeetingModalOpen(true)}>
                <Plus size={16} className="mr-2" /> Event
             </Button>
          </div>
       </div>

       {/* Calendar Grid */}
       <div className="flex-1 overflow-auto bg-white rounded-lg shadow border p-4">
          {viewMode === 'month' && renderMonthView()}
          
          {viewMode === 'week' && renderTimeGrid(
             eachDayOfInterval({ 
                start: startOfWeek(currentDate), 
                end: endOfWeek(currentDate) 
             })
          )}
          
          {viewMode === 'day' && renderTimeGrid([currentDate])}
       </div>

       {/* Modals */}
       <MeetingModal 
          isOpen={isMeetingModalOpen} 
          onClose={() => {
             setIsMeetingModalOpen(false);
             setNewMeetingData(null);
             setSelectedEvent(null);
          }}
          meeting={selectedEvent ? {
             ...selectedEvent,
             // Ensure data passed to modal is formatted correctly if modal expects it
          } : (newMeetingData ? { 
             title: '', 
             student_id: '',
             meeting_date: newMeetingData.meeting_date,
             meeting_time: newMeetingData.meeting_time,
             duration: 60,
             status: 'scheduled'
          } : null)}
          students={students}
          onSuccess={() => {
             fetchEvents();
             setIsMeetingModalOpen(false);
          }}
       />
       
       {/* If we want to view student details directly from event */}
       <StudentProfileModal 
          isOpen={!!selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
          studentId={selectedStudentId}
       />
    </div>
  );
};

export default CalendarView;