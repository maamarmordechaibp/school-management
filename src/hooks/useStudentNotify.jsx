import React, { useCallback, useState } from 'react';
import StudentNotifyModal from '@/components/modals/StudentNotifyModal';

/**
 * useStudentNotify — drop-in helper to prompt "send a notification?" after a
 * student record is created or updated.
 *
 * Usage:
 *   const { notify, notifyElement } = useStudentNotify(currentUser);
 *   // after a successful save:
 *   notify({
 *     studentId, studentName,
 *     action: 'created' | 'updated',
 *     recordType: 'Issue',
 *     title, details,
 *     relatedType: 'issue', relatedId,
 *     onDone,   // optional: called once the modal is closed (sent or dismissed)
 *   });
 *   // render once in the component tree:
 *   {notifyElement}
 */
export function useStudentNotify(currentUser) {
  const [opts, setOpts] = useState(null);

  const notify = useCallback((options) => setOpts(options || {}), []);
  const close = useCallback(() => {
    setOpts((cur) => {
      if (cur && typeof cur.onDone === 'function') cur.onDone();
      return null;
    });
  }, []);

  const notifyElement = (
    <StudentNotifyModal opts={opts} onClose={close} currentUser={currentUser} />
  );

  return { notify, notifyElement };
}

export default useStudentNotify;
