import React, { createContext, useContext, useState, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import StudentProfileView from '@/components/views/StudentProfileView';

const StudentProfileContext = createContext(null);

export const useStudentProfile = () => {
  const ctx = useContext(StudentProfileContext);
  if (!ctx) {
    // Permissive fallback so child components can be rendered outside the provider during tests
    return { open: () => {}, close: () => {} };
  }
  return ctx;
};

export const StudentProfileProvider = ({ children }) => {
  const [studentId, setStudentId] = useState(null);

  const open = useCallback((id) => {
    if (!id) return;
    setStudentId(id);
  }, []);

  const close = useCallback(() => setStudentId(null), []);

  return (
    <StudentProfileContext.Provider value={{ open, close, studentId }}>
      {children}

      <Dialog open={!!studentId} onOpenChange={(o) => !o && close()}>
        <DialogContent
          className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] p-0 overflow-hidden flex flex-col"
          dir="ltr"
        >
          <div className="flex items-center justify-end px-3 py-2 border-b bg-slate-50 shrink-0">
            <Button variant="ghost" size="sm" onClick={close}>
              <X className="h-4 w-4 mr-1" /> Close
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {studentId && (
              <StudentProfileView
                key={studentId}
                studentId={studentId}
                onBack={close}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </StudentProfileContext.Provider>
  );
};

export default StudentProfileContext;
