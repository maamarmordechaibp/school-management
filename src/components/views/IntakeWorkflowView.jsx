import React, { useState, useEffect } from 'react';
import { Plus, Search, Phone, Users, CheckCircle, Clock, ArrowRight, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkflowBadge } from '@/components/ui/workflow-badge';
import CallLogModal from '@/components/modals/CallLogModal';
import StudentModal from '@/components/modals/StudentModal';
import StudentPlanModal from '@/components/modals/StudentPlanModal';
import AssessmentForm from '@/components/forms/AssessmentForm';

const IntakeWorkflowView = ({ role, currentUser }) => {
  const { toast } = useToast();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('initial_contact');
  
  // Modal states
  const [isCallLogModalOpen, setIsCallLogModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isAssessmentMode, setIsAssessmentMode] = useState(false);
  const [studentsList, setStudentsList] = useState([]);

  useEffect(() => {
    loadIntakeStudents();
    loadAllStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, activeTab, searchTerm]);

  const loadAllStudents = async () => {
    const { data } = await supabase.from('students').select('*').order('name');
    setStudentsList(data || []);
  };

  const loadIntakeStudents = async () => {
    // Load students currently in the intake workflow
    const { data, error } = await supabase
      .from('students')
      .select('*, call_logs(count), assessments(count), student_plans(count)')
      .in('workflow_stage', ['initial_contact', 'info_gathering', 'assessment', 'plan_creation', 'plan_review'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load intake students' });
    } else {
      setStudents(data || []);
    }
  };

  const filterStudents = () => {
    let filtered = students.filter(s => s.workflow_stage === activeTab);
    
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.father_name && s.father_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.mother_name && s.mother_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredStudents(filtered);
  };

  const moveToNextStage = async (student, nextStage) => {
    const { error } = await supabase
      .from('students')
      .update({ 
        workflow_stage: nextStage,
        updated_at: new Date().toISOString()
      })
      .eq('id', student.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update workflow stage' });
    } else {
      toast({ title: 'Success', description: `Moved to ${nextStage.replace('_', ' ')}` });
      loadIntakeStudents();
    }
  };

  const handleLogCall = (student) => {
    setSelectedStudent(student);
    setIsCallLogModalOpen(true);
  };

  const handleStartAssessment = (student) => {
    setSelectedStudent(student);
    setIsAssessmentMode(true);
  };

  const handleCreatePlan = (student) => {
    setSelectedStudent(student);
    setIsPlanModalOpen(true);
  };

  const getNextStageAction = (currentStage, student) => {
    const stageActions = {
      'initial_contact': {
        nextStage: 'info_gathering',
        label: 'Start Info Gathering',
        action: () => moveToNextStage(student, 'info_gathering')
      },
      'info_gathering': {
        nextStage: 'assessment',
        label: 'Begin Assessment',
        action: () => {
          moveToNextStage(student, 'assessment');
          handleStartAssessment(student);
        }
      },
      'assessment': {
        nextStage: 'plan_creation',
        label: 'Create Plan',
        action: () => {
          moveToNextStage(student, 'plan_creation');
          handleCreatePlan(student);
        }
      },
      'plan_creation': {
        nextStage: 'plan_review',
        label: 'Submit for Review',
        action: () => moveToNextStage(student, 'plan_review')
      },
      'plan_review': {
        nextStage: 'service_setup',
        label: 'Approve & Setup Services',
        action: () => moveToNextStage(student, 'service_setup')
      }
    };

    return stageActions[currentStage];
  };

  const StudentCard = ({ student }) => {
    const nextAction = getNextStageAction(student.workflow_stage, student);
    const callCount = student.call_logs?.[0]?.count || 0;
    const assessmentCount = student.assessments?.[0]?.count || 0;
    const planCount = student.student_plans?.[0]?.count || 0;

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{student.name}</CardTitle>
              <p className="text-sm text-slate-500 mt-1">{student.class}</p>
            </div>
            <WorkflowBadge stage={student.workflow_stage} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Contact Info */}
            <div className="text-sm space-y-1">
              {student.father_name && (
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-slate-400" />
                  <span>Father: {student.father_name}</span>
                  {student.father_phone && <span className="text-slate-400">• {student.father_phone}</span>}
                </div>
              )}
              {student.mother_name && (
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-slate-400" />
                  <span>Mother: {student.mother_name}</span>
                  {student.mother_phone && <span className="text-slate-400">• {student.mother_phone}</span>}
                </div>
              )}
            </div>

            {/* Progress Indicators */}
            <div className="flex gap-4 pt-2 border-t text-xs">
              <div className="flex items-center gap-1">
                <Phone size={12} className="text-blue-500" />
                <span>{callCount} calls</span>
              </div>
              {assessmentCount > 0 && (
                <div className="flex items-center gap-1">
                  <FileText size={12} className="text-purple-500" />
                  <span>{assessmentCount} assessments</span>
                </div>
              )}
              {planCount > 0 && (
                <div className="flex items-center gap-1">
                  <CheckCircle size={12} className="text-green-500" />
                  <span>Plan created</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1"
                onClick={() => handleLogCall(student)}
              >
                <Phone size={14} className="mr-1" /> Log Call
              </Button>
              
              {nextAction && (
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={nextAction.action}
                >
                  {nextAction.label} <ArrowRight size={14} className="ml-1" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isAssessmentMode && selectedStudent) {
    return (
      <AssessmentForm
        student={selectedStudent}
        onSave={() => {
          setIsAssessmentMode(false);
          setSelectedStudent(null);
          loadIntakeStudents();
        }}
        onCancel={() => {
          setIsAssessmentMode(false);
          setSelectedStudent(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Intake & Assessment Workflow</h2>
          <p className="text-slate-600 mt-1">Manage new student cases from initial contact through plan creation</p>
        </div>
        <Button
          onClick={() => {
            setSelectedStudent(null);
            setIsStudentModalOpen(true);
          }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
        >
          <Plus size={20} className="mr-2" />
          New Intake
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Search by student or parent name..."
          className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Workflow Stages Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="initial_contact" className="relative">
            <FileText size={16} className="mr-2" />
            Initial Contact
            <Badge variant="secondary" className="ml-2">
              {students.filter(s => s.workflow_stage === 'initial_contact').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="info_gathering">
            <Users size={16} className="mr-2" />
            Info Gathering
            <Badge variant="secondary" className="ml-2">
              {students.filter(s => s.workflow_stage === 'info_gathering').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="assessment">
            <AlertCircle size={16} className="mr-2" />
            Assessment
            <Badge variant="secondary" className="ml-2">
              {students.filter(s => s.workflow_stage === 'assessment').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="plan_creation">
            <FileText size={16} className="mr-2" />
            Plan Creation
            <Badge variant="secondary" className="ml-2">
              {students.filter(s => s.workflow_stage === 'plan_creation').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="plan_review">
            <CheckCircle size={16} className="mr-2" />
            Plan Review
            <Badge variant="secondary" className="ml-2">
              {students.filter(s => s.workflow_stage === 'plan_review').length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredStudents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Clock size={48} className="text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">No students in this stage</h3>
                <p className="text-slate-500">Students will appear here as they progress through the workflow</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map(student => (
                <StudentCard key={student.id} student={student} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CallLogModal
        isOpen={isCallLogModalOpen}
        onClose={() => {
          setIsCallLogModalOpen(false);
          setSelectedStudent(null);
        }}
        students={studentsList}
        callLog={selectedStudent ? { student_id: selectedStudent.id } : null}
        onSuccess={() => {
          loadIntakeStudents();
          setIsCallLogModalOpen(false);
          setSelectedStudent(null);
        }}
      />

      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => {
          setIsStudentModalOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        onSuccess={() => {
          loadIntakeStudents();
          loadAllStudents();
          setIsStudentModalOpen(false);
          setSelectedStudent(null);
        }}
      />

      <StudentPlanModal
        isOpen={isPlanModalOpen}
        onClose={() => {
          setIsPlanModalOpen(false);
          setSelectedStudent(null);
        }}
        studentId={selectedStudent?.id}
        onSuccess={() => {
          loadIntakeStudents();
          setIsPlanModalOpen(false);
          setSelectedStudent(null);
        }}
      />
    </div>
  );
};

export default IntakeWorkflowView;
