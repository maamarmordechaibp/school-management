import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, X, ChevronDown, ChevronUp, User } from 'lucide-react';

/**
 * StudentPicker - Searchable student selector with browse capability
 * 
 * Props:
 *   students: Array of { id, first_name, last_name, hebrew_name, class_id?, class?: { name } }
 *   value: selected student ID (string/uuid)
 *   onChange: (studentId: string) => void
 *   onStudentSelect?: (student: object) => void  -- optional, gets full student object
 *   placeholder?: string
 *   disabled?: boolean
 *   label?: string  -- optional label above the picker
 */
const StudentPicker = ({
  students = [],
  value,
  onChange,
  onStudentSelect,
  placeholder = 'זוך תלמיד...',
  disabled = false,
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [browseMode, setBrowseMode] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Find selected student
  const selectedStudent = students.find(s => s.id === value);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setBrowseMode(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter students by search
  const filteredStudents = students.filter(s => {
    if (!searchQuery && !browseMode) return false;
    if (browseMode && !searchQuery) return true; // Show all in browse mode
    const q = searchQuery.toLowerCase();
    return (
      s.first_name?.toLowerCase().includes(q) ||
      s.last_name?.toLowerCase().includes(q) ||
      s.hebrew_name?.includes(searchQuery) ||
      s.father_name?.toLowerCase().includes(q) ||
      s.class?.name?.toLowerCase().includes(q)
    );
  });

  // Sort: by class then by name
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const classA = a.class?.name || '';
    const classB = b.class?.name || '';
    if (classA !== classB) return classA.localeCompare(classB);
    return (a.last_name || '').localeCompare(b.last_name || '');
  });

  // Group by class for browse mode
  const studentsByClass = {};
  if (browseMode) {
    sortedStudents.forEach(s => {
      const className = s.class?.name || 'אהן קלאס';
      if (!studentsByClass[className]) studentsByClass[className] = [];
      studentsByClass[className].push(s);
    });
  }

  const handleSelect = (student) => {
    onChange(student.id);
    if (onStudentSelect) onStudentSelect(student);
    setIsOpen(false);
    setBrowseMode(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onChange('');
    if (onStudentSelect) onStudentSelect(null);
    setSearchQuery('');
  };

  const getDisplayName = (s) => {
    if (!s) return '';
    return s.hebrew_name || `${s.first_name} ${s.last_name}`;
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Selected Student Display / Search Input */}
      {selectedStudent && !isOpen ? (
        <div className="flex items-center justify-between border rounded-md px-3 py-2 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
              {getDisplayName(selectedStudent).charAt(0)}
            </div>
            <div>
              <span className="font-medium text-sm">{getDisplayName(selectedStudent)}</span>
              {selectedStudent.class?.name && (
                <Badge variant="outline" className="mr-2 text-[10px] py-0">{selectedStudent.class.name}</Badge>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setIsOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}>
              <Search className="h-3 w-3 text-slate-400" />
            </Button>
            {!disabled && (
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleClear}>
                <X className="h-3 w-3 text-red-400" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
              if (e.target.value) setBrowseMode(false);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className="pr-10"
          />
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl max-h-80 overflow-hidden">
          {/* Browse / Search Toggle */}
          <div className="flex items-center justify-between px-3 py-2 border-b bg-slate-50">
            <span className="text-xs text-slate-500">
              {browseMode ? `${sortedStudents.length} תלמידים` : searchQuery ? `${sortedStudents.length} רעזולטאטן` : 'שרייבט א נאמען אדער בראוזט'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => {
                setBrowseMode(!browseMode);
                setSearchQuery('');
              }}
            >
              {browseMode ? (
                <>סוכן <Search className="h-3 w-3 mr-1" /></>
              ) : (
                <>אלע תלמידים <ChevronDown className="h-3 w-3 mr-1" /></>
              )}
            </Button>
          </div>

          {/* Student List */}
          <div className="max-h-64 overflow-y-auto">
            {browseMode && !searchQuery ? (
              // Browse by class
              Object.entries(studentsByClass).map(([className, classStudents]) => (
                <div key={className}>
                  <div className="sticky top-0 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 border-b">
                    {className} ({classStudents.length})
                  </div>
                  {classStudents.map(student => (
                    <StudentRow
                      key={student.id}
                      student={student}
                      onSelect={handleSelect}
                      getDisplayName={getDisplayName}
                      isSelected={student.id === value}
                    />
                  ))}
                </div>
              ))
            ) : (
              // Search results
              sortedStudents.map(student => (
                <StudentRow
                  key={student.id}
                  student={student}
                  onSelect={handleSelect}
                  getDisplayName={getDisplayName}
                  isSelected={student.id === value}
                  showClass
                />
              ))
            )}

            {(searchQuery && sortedStudents.length === 0) && (
              <div className="p-4 text-center text-sm text-slate-400">
                <User className="h-8 w-8 mx-auto mb-2 opacity-40" />
                קיין תלמידים נישט געפונען פאר "{searchQuery}"
              </div>
            )}

            {!searchQuery && !browseMode && (
              <div className="p-4 text-center text-sm text-slate-400">
                שרייבט א נאמען צו זוכן, אדער דרוקט "אלע תלמידים" צו בראוזן
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Individual student row component
const StudentRow = ({ student, onSelect, getDisplayName, isSelected, showClass = false }) => (
  <button
    type="button"
    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-blue-50 transition-colors text-right ${
      isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
    }`}
    onClick={() => onSelect(student)}
  >
    <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold flex-shrink-0">
      {getDisplayName(student).charAt(0)}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1 flex-wrap">
        <span className="font-medium truncate">{getDisplayName(student)}</span>
        {student.hebrew_name && student.first_name && (
          <span className="text-xs text-slate-400 truncate">({student.first_name} {student.last_name})</span>
        )}
      </div>
      {showClass && student.class?.name && (
        <span className="text-xs text-slate-400">{student.class.name}</span>
      )}
    </div>
    {!showClass && student.class?.name && (
      <Badge variant="outline" className="text-[10px] py-0 flex-shrink-0">{student.class.name}</Badge>
    )}
  </button>
);

export default StudentPicker;
