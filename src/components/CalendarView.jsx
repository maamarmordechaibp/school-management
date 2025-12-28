import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Edit, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CalendarView = ({ meetings, onEditMeeting, onDeleteMeeting }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getMeetingsForDay = (date) => {
    if (!date) return [];
    return meetings.filter((meeting) => {
      const meetingDate = new Date(meeting.meeting_date);
      return (
        meetingDate.getDate() === date.getDate() &&
        meetingDate.getMonth() === date.getMonth() &&
        meetingDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const isPastMeeting = (meetingDate) => {
    return new Date(meetingDate) < new Date();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-slate-800">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={previousMonth}>
            <ChevronLeft size={20} />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center font-semibold text-slate-600 py-2">
            {day}
          </div>
        ))}

        {days.map((day, index) => {
          const dayMeetings = getMeetingsForDay(day);
          const isToday = day && 
            day.getDate() === new Date().getDate() &&
            day.getMonth() === new Date().getMonth() &&
            day.getFullYear() === new Date().getFullYear();

          return (
            <div
              key={index}
              className={`min-h-[120px] border border-slate-200 rounded-lg p-2 ${
                !day ? 'bg-slate-50' : ''
              } ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
            >
              {day && (
                <>
                  <div className={`text-sm font-medium mb-2 ${isToday ? 'text-blue-600' : 'text-slate-600'}`}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayMeetings.map((meeting) => {
                      const isPast = isPastMeeting(meeting.meeting_date) && meeting.status === 'scheduled';
                      return (
                        <div
                          key={meeting.id}
                          className={`text-xs p-2 rounded cursor-pointer group relative ${
                            isPast
                              ? 'bg-red-100 border border-red-300'
                              : 'bg-indigo-100 hover:bg-indigo-200'
                          }`}
                        >
                          {isPast && (
                            <Clock size={12} className="inline mr-1 text-red-600" />
                          )}
                          <div className="font-medium text-slate-800 truncate">
                            {meeting.title}
                          </div>
                          <div className="text-slate-600">
                            {new Date(meeting.meeting_date).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                          <div className="hidden group-hover:flex absolute right-1 top-1 gap-1 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditMeeting(meeting);
                              }}
                              className="p-1 bg-white rounded shadow hover:bg-slate-100"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteMeeting(meeting.id);
                              }}
                              className="p-1 bg-white rounded shadow hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;