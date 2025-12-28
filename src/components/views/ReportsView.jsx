import React, { useState, useEffect } from 'react';
import { FileText, Download, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { logActivity } from '@/lib/logger';

const ReportsView = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [exportType, setExportType] = useState('pdf');

  const generateStudentReport = async () => {
    setLoading(true);
    try {
      const { data: students } = await supabase.from('students').select('*');
      
      const doc = new jsPDF();
      doc.text("Student Report", 14, 15);
      
      const tableData = students.map(s => [s.name, s.class, s.teacher, s.father_phone || 'N/A']);
      
      doc.autoTable({
        head: [['Name', 'Class', 'Teacher', 'Contact']],
        body: tableData,
        startY: 20
      });
      
      doc.save(`students_report_${new Date().toISOString().split('T')[0]}.pdf`);
      
      await logActivity('Generated Student Report', 'PDF export of all students');
      toast({ title: "Success", description: "Report generated successfully" });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Failed to generate report" });
    } finally {
      setLoading(false);
    }
  };

  const generateIssuesReport = async () => {
    setLoading(true);
    try {
      const { data: issues } = await supabase.from('issues').select('*, students(name)');
      
      const doc = new jsPDF();
      doc.text("Issues Report", 14, 15);
      
      const tableData = issues.map(i => [
        i.title, 
        i.students?.name, 
        i.priority, 
        i.status, 
        new Date(i.created_at).toLocaleDateString()
      ]);
      
      doc.autoTable({
        head: [['Title', 'Student', 'Priority', 'Status', 'Date']],
        body: tableData,
        startY: 20,
        styles: { fontSize: 8 }
      });
      
      doc.save(`issues_report_${new Date().toISOString().split('T')[0]}.pdf`);
      await logActivity('Generated Issues Report', 'PDF export of all issues');
      toast({ title: "Success", description: "Report generated successfully" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to generate report" });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async (table) => {
    setLoading(true);
    try {
      const { data } = await supabase.from(table).select('*');
      
      if (!data || data.length === 0) {
        toast({ title: "No Data", description: "No records to export" });
        return;
      }

      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(obj => Object.values(obj).map(v => `"${v}"`).join(','));
      const csv = [headers, ...rows].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${table}_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      await logActivity(`Exported ${table}`, 'CSV export');
      toast({ title: "Success", description: "CSV exported successfully" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Export failed" });
    } finally {
      setLoading(false);
    }
  };

  const backupData = async () => {
    setLoading(true);
    try {
      const tables = ['students', 'issues', 'grades', 'meetings', 'call_logs', 'teacher_remarks', 'attendance'];
      const backup = {};
      
      for (const table of tables) {
        const { data } = await supabase.from(table).select('*');
        backup[table] = data;
      }

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `full_backup_${new Date().toISOString()}.json`;
      a.click();
      
      await logActivity('System Backup', 'Full system JSON export');
      toast({ title: "Backup Complete", description: "System data downloaded" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Backup failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Reports & Exports</h2>
        <p className="text-slate-600 mt-1">Generate insights and manage data exports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* PDF Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText size={20}/> PDF Reports</CardTitle>
            <CardDescription>Formatted documents for printing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-between" onClick={generateStudentReport} disabled={loading}>
              All Students List <Download size={16} />
            </Button>
            <Button variant="outline" className="w-full justify-between" onClick={generateIssuesReport} disabled={loading}>
              Issues Report <Download size={16} />
            </Button>
          </CardContent>
        </Card>

        {/* Data Exports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Filter size={20}/> Data Exports (CSV)</CardTitle>
            <CardDescription>Raw data for analysis in Excel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-between" onClick={() => exportToCSV('students')} disabled={loading}>
              Students Data <Download size={16} />
            </Button>
            <Button variant="outline" className="w-full justify-between" onClick={() => exportToCSV('grades')} disabled={loading}>
              Grades Data <Download size={16} />
            </Button>
            <Button variant="outline" className="w-full justify-between" onClick={() => exportToCSV('attendance')} disabled={loading}>
              Attendance Data <Download size={16} />
            </Button>
          </CardContent>
        </Card>

        {/* System */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><RefreshCw size={20}/> System</CardTitle>
            <CardDescription>Backup and maintenance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full bg-slate-800 hover:bg-slate-700" onClick={backupData} disabled={loading}>
              Full System Backup (JSON)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsView;