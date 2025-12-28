import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, AlertCircle, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const ImportStudentsModal = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      readExcel(selectedFile);
    }
  };

  const readExcel = (file) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      
      // Simple validation/mapping
      const mappedData = jsonData.map(row => ({
        name: row['Name'] || row['Student Name'] || row['name'],
        class: row['Class'] || row['Grade'] || row['class'],
        teacher: row['Teacher'] || row['Rebbe'] || row['teacher'],
        father_name: row['Father'] || row['Father Name'] || '',
        father_phone: row['Father Phone'] || '',
        mother_name: row['Mother'] || row['Mother Name'] || '',
        mother_phone: row['Mother Phone'] || '',
      })).filter(s => s.name && s.class); // Basic filter

      setPreviewData(mappedData);
      setIsProcessing(false);
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (previewData.length === 0) return;

    setIsUploading(true);
    try {
      const { error } = await supabase.from('students').insert(previewData);

      if (error) throw error;

      toast({
        title: "Import Successful",
        description: `Successfully imported ${previewData.length} students.`
      });
      onSuccess();
      onClose();
      setFile(null);
      setPreviewData([]);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: error.message
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Bulk Import Students</DialogTitle>
          <DialogDescription>
            Upload an Excel (.xlsx) file with columns: Name, Class, Teacher, Father Name, etc.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-50 transition-colors">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
              <FileSpreadsheet className="h-12 w-12 text-slate-400 mb-2" />
              <span className="text-sm font-medium text-slate-700">
                {file ? file.name : "Click to upload Excel file"}
              </span>
              <span className="text-xs text-slate-500 mt-1">Supports .xlsx, .xls, .csv</span>
            </label>
          </div>

          {isProcessing && (
            <div className="text-center py-4 text-slate-500">
              <Loader2 className="animate-spin h-6 w-6 mx-auto mb-2" />
              Processing file...
            </div>
          )}

          {previewData.length > 0 && (
            <div className="bg-slate-50 rounded-lg p-4 border max-h-60 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-700">Preview ({previewData.length} students)</span>
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <Check size={12} /> Ready to import
                </span>
              </div>
              <table className="w-full text-xs text-left">
                <thead className="text-slate-500 border-b">
                  <tr>
                    <th className="py-1">Name</th>
                    <th className="py-1">Class</th>
                    <th className="py-1">Teacher</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {previewData.slice(0, 5).map((s, i) => (
                    <tr key={i}>
                      <td className="py-1 font-medium">{s.name}</td>
                      <td className="py-1">{s.class}</td>
                      <td className="py-1">{s.teacher}</td>
                    </tr>
                  ))}
                  {previewData.length > 5 && (
                    <tr>
                      <td colSpan="3" className="py-2 text-center text-slate-400 italic">
                        ...and {previewData.length - 5} more
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              onClick={handleImport} 
              disabled={previewData.length === 0 || isUploading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUploading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
              Import Students
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportStudentsModal;