import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import ExportDialog from '@/components/ExportDialog';

/**
 * ExportButton — drop-in "Export" button that opens the shared ExportDialog.
 * Pass the page's currently-filtered `rows` plus a `columns` config and it
 * handles the rest (format choice, field selection, sorting, grouping).
 *
 * All ExportDialog props are forwarded through.
 */
const ExportButton = ({ variant = 'outline', className = '', label, ...dialogProps }) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant={variant} className={className} onClick={() => setOpen(true)}>
        <Download className="me-2 h-4 w-4" />
        {label || t('export.button')}
      </Button>
      <ExportDialog open={open} onOpenChange={setOpen} {...dialogProps} />
    </>
  );
};

export default ExportButton;
