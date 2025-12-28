import React, { useState, useEffect } from 'react';
import { DollarSign, Users, AlertCircle, CheckCircle, Download, Filter, Search, FileText, PieChart, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const FinancialReportsView = ({ role, currentUser }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [fees, setFees] = useState([]);
  const [studentFees, setStudentFees] = useState([]);
  const [selectedFee, setSelectedFee] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [grades, setGrades] = useState([]);
  const [gradeFilter, setGradeFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all fees
      const { data: feesData, error: feesError } = await supabase
        .from('fees')
        .select('*')
        .order('created_at', { ascending: false });
      if (feesError) throw feesError;
      setFees(feesData || []);

      // Load all student fees with student details
      const { data: sfData, error: sfError } = await supabase
        .from('student_fees')
        .select(`
          *,
          student:students(id, first_name, last_name, class_id, class:classes(id, name, grade_id, grade:grades(id, name))),
          fee:fees(id, name, amount, due_date)
        `);
      if (sfError) throw sfError;
      setStudentFees(sfData || []);

      // Load grades
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select('*')
        .order('grade_number');
      if (gradesError) throw gradesError;
      setGrades(gradesData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  // Filter student fees
  const filteredStudentFees = studentFees.filter(sf => {
    const studentName = `${sf.student?.first_name || ''} ${sf.student?.last_name || ''}`.toLowerCase();
    const matchesSearch = studentName.includes(searchQuery.toLowerCase());
    const matchesFee = selectedFee === 'all' || sf.fee_id === selectedFee;
    const matchesStatus = statusFilter === 'all' || sf.status === statusFilter;
    const matchesGrade = gradeFilter === 'all' || sf.student?.class?.grade_id === gradeFilter;
    return matchesSearch && matchesFee && matchesStatus && matchesGrade;
  });

  // Calculate summary stats
  const totalExpected = filteredStudentFees.reduce((sum, sf) => sum + sf.amount, 0);
  const totalCollected = filteredStudentFees.reduce((sum, sf) => sum + sf.amount_paid, 0);
  const totalOutstanding = totalExpected - totalCollected;
  const paidCount = filteredStudentFees.filter(sf => sf.status === 'paid').length;
  const pendingCount = filteredStudentFees.filter(sf => sf.status === 'pending').length;
  const partialCount = filteredStudentFees.filter(sf => sf.status === 'partial').length;

  // Get fee summary
  const getFeeSummary = () => {
    const summary = {};
    studentFees.forEach(sf => {
      const feeName = sf.fee?.name || 'Unknown';
      if (!summary[feeName]) {
        summary[feeName] = {
          name: feeName,
          total: 0,
          collected: 0,
          students: 0,
          paid: 0
        };
      }
      summary[feeName].total += sf.amount;
      summary[feeName].collected += sf.amount_paid;
      summary[feeName].students += 1;
      if (sf.status === 'paid') summary[feeName].paid += 1;
    });
    return Object.values(summary);
  };

  // Export to CSV
  const exportToCsv = () => {
    const headers = ['Student Name', 'Class', 'Grade', 'Fee', 'Amount', 'Paid', 'Outstanding', 'Status'];
    const rows = filteredStudentFees.map(sf => [
      `${sf.student?.first_name || ''} ${sf.student?.last_name || ''}`,
      sf.student?.class?.name || '',
      sf.student?.class?.grade?.name || '',
      sf.fee?.name || '',
      sf.amount.toFixed(2),
      sf.amount_paid.toFixed(2),
      (sf.amount - sf.amount_paid).toFixed(2),
      sf.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({ title: 'Success', description: 'Report exported successfully' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Financial Reports</h1>
          <p className="text-slate-500">Track fee collection and outstanding balances</p>
        </div>
        <Button onClick={exportToCsv} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">${totalExpected.toFixed(0)}</p>
              <p className="text-sm text-slate-500">Total Expected</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">${totalCollected.toFixed(0)}</p>
              <p className="text-sm text-slate-500">Collected</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">${totalOutstanding.toFixed(0)}</p>
              <p className="text-sm text-slate-500">Outstanding</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Users className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{paidCount}</p>
              <p className="text-sm text-slate-500">Fully Paid</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Users className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount + partialCount}</p>
              <p className="text-sm text-slate-500">Unpaid/Partial</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Student Details</TabsTrigger>
          <TabsTrigger value="summary">Fee Summary</TabsTrigger>
          <TabsTrigger value="unpaid">Unpaid List</TabsTrigger>
        </TabsList>

        {/* Detailed Report Tab */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Student Fee Details</CardTitle>
                  <CardDescription>Complete breakdown by student</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search student..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-48"
                    />
                  </div>
                  <Select value={selectedFee} onValueChange={setSelectedFee}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select fee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Fees</SelectItem>
                      {fees.map(fee => (
                        <SelectItem key={fee.id} value={fee.id}>{fee.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={gradeFilter} onValueChange={setGradeFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Grades</SelectItem>
                      {grades.map(grade => (
                        <SelectItem key={grade.id} value={grade.id}>{grade.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudentFees.map((sf) => (
                    <TableRow key={sf.id}>
                      <TableCell className="font-medium">
                        {sf.student?.first_name} {sf.student?.last_name}
                      </TableCell>
                      <TableCell>
                        <span className="text-slate-500">{sf.student?.class?.name}</span>
                      </TableCell>
                      <TableCell>{sf.fee?.name}</TableCell>
                      <TableCell className="text-right">${sf.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-green-600">${sf.amount_paid.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        ${(sf.amount - sf.amount_paid).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={sf.status === 'paid' ? 'default' : sf.status === 'partial' ? 'secondary' : 'destructive'}
                          className={sf.status === 'paid' ? 'bg-green-500' : ''}
                        >
                          {sf.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredStudentFees.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No records found matching your filters</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fee Summary Tab */}
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Fee Collection Summary</CardTitle>
              <CardDescription>Overview of each fee's collection status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fee Name</TableHead>
                    <TableHead className="text-center">Students</TableHead>
                    <TableHead className="text-right">Total Expected</TableHead>
                    <TableHead className="text-right">Collected</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead className="text-center">Collection %</TableHead>
                    <TableHead className="text-center">Paid / Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFeeSummary().map((summary, idx) => {
                    const percent = summary.total > 0 ? Math.round((summary.collected / summary.total) * 100) : 0;
                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-semibold">{summary.name}</TableCell>
                        <TableCell className="text-center">{summary.students}</TableCell>
                        <TableCell className="text-right">${summary.total.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-green-600">${summary.collected.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-red-600">
                          ${(summary.total - summary.collected).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${percent >= 80 ? 'bg-green-500' : percent >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{percent}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{summary.paid} / {summary.students}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Unpaid List Tab */}
        <TabsContent value="unpaid">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Outstanding Balances</CardTitle>
              <CardDescription>Students with unpaid or partial fees</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead className="text-right">Owed</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentFees
                    .filter(sf => sf.status !== 'paid' && sf.status !== 'waived')
                    .sort((a, b) => (b.amount - b.amount_paid) - (a.amount - a.amount_paid))
                    .map((sf) => (
                      <TableRow key={sf.id} className="bg-red-50/50">
                        <TableCell className="font-medium">
                          {sf.student?.first_name} {sf.student?.last_name}
                        </TableCell>
                        <TableCell>{sf.student?.class?.name}</TableCell>
                        <TableCell>{sf.student?.class?.grade?.name}</TableCell>
                        <TableCell>{sf.fee?.name}</TableCell>
                        <TableCell className="text-right font-bold text-red-600">
                          ${(sf.amount - sf.amount_paid).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {sf.fee?.due_date ? new Date(sf.fee.due_date).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={sf.status === 'partial' ? 'secondary' : 'destructive'}>
                            {sf.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              {studentFees.filter(sf => sf.status !== 'paid' && sf.status !== 'waived').length === 0 && (
                <div className="text-center py-12 text-green-600">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-lg font-medium">All caught up!</p>
                  <p className="text-sm text-slate-500">No outstanding balances</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialReportsView;
