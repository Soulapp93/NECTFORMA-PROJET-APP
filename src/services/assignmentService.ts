import { supabase } from '@/integrations/supabase/client';

export interface Assignment {
  id: string;
  module_id: string;
  title: string;
  description?: string | null;
  assignment_type?: string | null;
  due_date?: string | null;
  max_points?: number | null;
  is_published?: boolean | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  submitted_at: string;
  content: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  student?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  correction?: {
    id: string;
    submission_id: string;
    corrector_id: string;
    grade: number | null;
    feedback: string | null;
    published_at: string | null;
    is_corrected?: boolean;
    score?: number | null;
    max_score?: number | null;
    comments?: string | null;
    created_at: string;
    updated_at: string;
  };
  submission_text?: string | null;
}

export const assignmentService = {
  async getModuleAssignments(moduleId: string): Promise<Assignment[]> {
    const { data, error } = await (supabase
      .from('module_assignments') as any)
      .select('*')
      .eq('module_id', moduleId)
      .order('created_at');
    
    if (error) throw error;
    return data || [];
  },

  async createAssignment(assignment: Partial<Assignment> & { module_id: string; title: string }): Promise<Assignment> {
    const { data, error } = await (supabase
      .from('module_assignments') as any)
      .insert(assignment)
      .select()
      .single();

    if (error) throw error;

    // Notifier si le devoir est publié directement
    if (assignment.is_published) {
      await this.notifyAssignmentPublication(data as Assignment);
    }

    return data as Assignment;
  },

  async updateAssignment(id: string, updates: Partial<Assignment>): Promise<Assignment> {
    const { data, error } = await (supabase
      .from('module_assignments') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Notifier si le devoir vient d'être publié
    if (updates.is_published === true) {
      await this.notifyAssignmentPublication(data as Assignment);
    }

    return data as Assignment;
  },

  async deleteAssignment(id: string) {
    const { error } = await (supabase
      .from('module_assignments') as any)
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async addAssignmentFile(file: { assignment_id: string; file_name: string; file_url: string; file_size?: number }) {
    const { data, error } = await (supabase
      .from('assignment_files') as any)
      .insert(file)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAssignmentSubmissions(assignmentId: string): Promise<AssignmentSubmission[]> {
    // Fetch submissions
    const { data: submissions, error } = await supabase
      .from('assignment_submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });
    
    if (error) throw error;
    if (!submissions) return [];

    // Fetch student info and corrections separately
    const enrichedSubmissions: AssignmentSubmission[] = [];
    
    for (const submission of submissions) {
      // Fetch student info
      const { data: student } = await supabase
        .from('users')
        .select('first_name, last_name, email')
        .eq('id', submission.student_id)
        .single();

      // Fetch correction
      const { data: correction } = await supabase
        .from('assignment_corrections')
        .select('*')
        .eq('submission_id', submission.id)
        .maybeSingle();

      enrichedSubmissions.push({
        ...submission,
        submission_text: submission.content,
        student: student || undefined,
        correction: correction ? {
          ...correction,
          is_corrected: !!correction.grade,
          score: correction.grade,
          max_score: 20, // Default max score
          comments: correction.feedback
        } : undefined
      });
    }

    return enrichedSubmissions;
  },

  async submitAssignment(submission: { assignment_id: string; student_id: string; content?: string; status?: string }) {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .insert(submission)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async addSubmissionFile(file: { submission_id: string; file_name: string; file_url: string; file_size?: number }) {
    const { data, error } = await (supabase
      .from('submission_files') as any)
      .insert(file)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getSubmissionFiles(submissionId: string) {
    const { data, error } = await (supabase
      .from('submission_files') as any)
      .select('*')
      .eq('submission_id', submissionId);
    
    if (error) throw error;
    return data || [];
  },

  async correctSubmission(
    submissionId: string,
    correction: { corrector_id: string; grade?: number | null; feedback?: string | null; published_at?: string | null }
  ) {
    // Check if correction exists
    const { data: existing } = await supabase
      .from('assignment_corrections')
      .select('id')
      .eq('submission_id', submissionId)
      .maybeSingle();

    if (existing) {
      // Update existing correction
      const { data, error } = await supabase
        .from('assignment_corrections')
        .update({
          ...correction,
          updated_at: new Date().toISOString()
        })
        .eq('submission_id', submissionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new correction
      const { data, error } = await supabase
        .from('assignment_corrections')
        .insert({
          ...correction,
          submission_id: submissionId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  async publishCorrections(assignmentId: string) {
    // Get all submissions for the assignment
    const { data: submissions } = await supabase
      .from('assignment_submissions')
      .select('id')
      .eq('assignment_id', assignmentId);

    if (!submissions) return;

    // Update all corrections to published
    const { error } = await supabase
      .from('assignment_corrections')
      .update({ published_at: new Date().toISOString() })
      .in('submission_id', submissions.map(s => s.id));

    if (error) throw error;

    // Notifier la publication des corrections
    await this.notifyCorrectionsPublished(assignmentId);
  },

  // Notifier la publication d'un devoir (app + email)
  async notifyAssignmentPublication(assignment: Assignment) {
    try {
      const { notificationService } = await import('./notificationService');
      const { emailNotificationService } = await import('./emailNotificationService');
      
      // Récupérer la formation et le module via le module
      const { data: module } = await supabase
        .from('formation_modules')
        .select('formation_id, title')
        .eq('id', assignment.module_id)
        .single();

      if (module?.formation_id) {
        // Notification in-app
        await notificationService.notifyFormationUsers(
          module.formation_id,
          'Nouveau devoir publié',
          `Un nouveau devoir "${assignment.title}" a été publié.`,
          'assignment',
          { 
            assignment_id: assignment.id,
            module_id: assignment.module_id,
            due_date: assignment.due_date
          }
        );

        // Récupérer les étudiants de la formation pour les emails
        const { data: userAssignments } = await supabase
          .from('user_formation_assignments')
          .select('user_id')
          .eq('formation_id', module.formation_id);

        if (userAssignments) {
          for (const ua of userAssignments) {
            const { data: student } = await supabase
              .from('users')
              .select('email, first_name, last_name, role')
              .eq('id', ua.user_id)
              .eq('role', 'Étudiant')
              .maybeSingle();

            if (student) {
              emailNotificationService.notifyAssignmentCreated(
                student.email,
                student.first_name,
                student.last_name,
                assignment.title,
                module.title,
                assignment.due_date || undefined
              ).catch(console.error); // Fire and forget
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending assignment publication notifications:', error);
    }
  },

  // Notifier la publication des corrections (app + email)
  async notifyCorrectionsPublished(assignmentId: string) {
    try {
      const { notificationService } = await import('./notificationService');
      const { emailNotificationService } = await import('./emailNotificationService');
      
      // Récupérer l'assignment
      const { data: assignment } = await (supabase
        .from('module_assignments') as any)
        .select('*')
        .eq('id', assignmentId)
        .single();

      if (!assignment) return;

      // Récupérer les soumissions avec corrections
      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select('id, student_id')
        .eq('assignment_id', assignmentId);

      if (submissions) {
        // Récupérer les corrections pour avoir les notes
        const { data: corrections } = await supabase
          .from('assignment_corrections')
          .select('submission_id, grade')
          .in('submission_id', submissions.map(s => s.id));

        const correctionMap = new Map(corrections?.map(c => [c.submission_id, c.grade]) || []);

        // Notifier chaque étudiant qui a rendu le devoir
        for (const submission of submissions) {
          // Notification in-app
          await notificationService.notifyUser(
            submission.student_id,
            'Correction publiée',
            `La correction du devoir "${(assignment as Assignment).title}" est disponible.`,
            'correction',
            { 
              assignment_id: assignmentId,
              module_id: (assignment as Assignment).module_id
            }
          );

          // Notification email
          const { data: student } = await supabase
            .from('users')
            .select('email, first_name, last_name')
            .eq('id', submission.student_id)
            .single();

          if (student) {
            const grade = correctionMap.get(submission.student_id);
            emailNotificationService.notifyCorrectionPublished(
              student.email,
              student.first_name,
              student.last_name,
              (assignment as Assignment).title,
              grade !== undefined && grade !== null ? grade : undefined,
              (assignment as Assignment).max_points || 20
            ).catch(console.error); // Fire and forget
          }
        }
      }
    } catch (error) {
      console.error('Error sending correction notifications:', error);
    }
  }
};
