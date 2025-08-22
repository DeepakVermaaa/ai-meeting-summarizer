/**
 * Mock Data - Senior Developer Hiring Decision Meeting
 * Text Section, Alert List, and Checklist Components Only
 * Simplified with fewer points for demo clarity
 */

// Mock AG-UI message for testing - Hiring Decision Meeting
export const MOCK_AGUI_MESSAGE = {
  version: '1.0',
  type: 'component_render',
  session_id: 'hiring-session-123',
  timestamp: new Date().toISOString(),
  components: [
    // Candidate Summary
    {
      id: 'comp-1',
      type: 'text_section',
      title: 'Senior Developer Hiring Decision',
      priority: 1,
      category: 'overview',
      data: {
        id: 'hiring-text-1',
        title: 'Candidate Evaluation Summary',
        description: 'Final hiring decision meeting for Senior Backend Developer position',
        content: `
          <h3>Hiring Decision Meeting - Senior Backend Developer Role</h3>
          <p>After a comprehensive interview process, we have evaluated three final candidates for our Senior Backend Developer position. The role is critical for our Q2 product launch and requires immediate filling due to current team capacity constraints.</p>
          
          <h4>Top Candidate: Maria Rodriguez</h4>
          <p>Maria brings 8 years of Python/Django experience with strong microservices background. She impressed the technical panel with her system design approach and has excellent communication skills. Currently earning $140K at her current role.</p>
          
          <blockquote>
            "Maria demonstrated exceptional problem-solving skills and would be a strong technical leader for our team." - David Kim, Engineering Manager
          </blockquote>
          
          <h4>Compensation and Timeline</h4>
          <p>We're prepared to offer $155K base salary plus equity package. Maria has indicated she can start within 3 weeks if offered. Her current company has made a counter-offer to retain her.</p>
        `,
        key_points: [
          'Maria Rodriguez is the top candidate with 8 years Python experience',
          'Strong technical skills and system design capabilities',
          'Current salary $140K, our offer $155K plus equity',
          'Can start within 3 weeks if position offered',
          'Competing with counter-offer from current employer'
        ],
        sentiment: 'positive',
        word_count: 142,
        last_updated: new Date().toISOString()
      },
      agui_spec: {
        version: '1.0',
        renderer_hints: {
          preferred_style: 'expanded',
          interaction_mode: 'interactive',
          show_header: true,
          collapsible: true
        }
      }
    },
    
    // Hiring Action Items
    {
      id: 'comp-2',
      type: 'checklist',
      title: 'Hiring Process Next Steps',
      priority: 2,
      category: 'action',
      data: {
        id: 'hiring-checklist-1',
        title: 'Post-Decision Actions',
        description: 'Critical steps to complete the hiring process',
        items: [
          {
            id: 'action-1',
            task: 'Extend formal offer to Maria Rodriguez with compensation package',
            owner: 'Sarah Chen, HR Director',
            due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day
            priority: 'high',
            status: 'pending',
            estimated_hours: 2,
            tags: ['offer', 'compensation', 'urgent']
          },
          {
            id: 'action-2',
            task: 'Contact other candidates with decision update',
            owner: 'Sarah Chen, HR Director',
            due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
            priority: 'medium',
            status: 'pending',
            estimated_hours: 1,
            tags: ['communication', 'candidates']
          },
          {
            id: 'action-3',
            task: 'Prepare onboarding plan and workspace setup',
            owner: 'David Kim, Engineering Manager',
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week
            priority: 'medium',
            status: 'pending',
            estimated_hours: 4,
            tags: ['onboarding', 'workspace', 'preparation']
          },
          {
            id: 'action-4',
            task: 'Schedule team introduction meetings for first week',
            owner: 'David Kim, Engineering Manager',
            due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks
            priority: 'low',
            status: 'pending',
            estimated_hours: 2,
            tags: ['team', 'introductions', 'meetings']
          }
        ],
        total_items: 4,
        completed: 0,
        show_progress: true
      },
      agui_spec: {
        version: '1.0',
        renderer_hints: {
          preferred_style: 'expanded',
          interaction_mode: 'interactive',
          show_header: true
        }
      }
    },
    
    // Hiring Risks and Concerns
    {
      id: 'comp-3',
      type: 'alert_list',
      title: 'Hiring Risks & Considerations',
      priority: 3,
      category: 'risk',
      data: {
        id: 'hiring-alerts-1',
        title: 'Risk Assessment',
        description: 'Potential risks and concerns in the hiring decision',
        alerts: [
          {
            id: 'risk-1',
            type: 'warning',
            severity: 'high',
            title: 'Candidate may accept counter-offer from current employer',
            description: 'Maria mentioned her current company is preparing a counter-offer. If she declines our offer, we will need to restart the hiring process, causing significant delays to Q2 product timeline.',
            mitigation: 'Move quickly with our offer. Emphasize growth opportunities and company culture benefits. Be prepared to negotiate on compensation if needed.',
            owner: 'Sarah Chen',
            due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'open',
            created_date: new Date().toISOString()
          },
          {
            id: 'risk-2',
            type: 'risk',
            severity: 'medium',
            title: 'Budget impact of higher than planned salary offer',
            description: 'Our offer of $155K is $15K above the budgeted amount for this role. This may set precedent for other senior hires and impact Q2 budget allocations.',
            mitigation: 'Finance team to review impact on quarterly budget. Consider adjusting other hiring plans if necessary. Document justification for above-budget offer.',
            owner: 'Finance Team',
            due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'open',
            created_date: new Date().toISOString()
          },
          {
            id: 'risk-3',
            type: 'info',
            severity: 'low',
            title: 'Team integration timeline may be tight for Q2 deadline',
            description: 'Even with a 3-week start date, Maria will need time to ramp up on our codebase and processes. Full productivity may not be achieved until mid-Q2.',
            mitigation: 'Prepare comprehensive onboarding plan. Assign senior team member as mentor. Focus initial tasks on areas matching her background.',
            owner: 'David Kim',
            due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'open',
            created_date: new Date().toISOString()
          }
        ],
        total_count: 3,
        severity_breakdown: {
          critical: 0,
          high: 1,
          medium: 1,
          low: 1
        }
      },
      agui_spec: {
        version: '1.0',
        renderer_hints: {
          preferred_style: 'expanded',
          interaction_mode: 'interactive',
          show_header: true
        }
      }
    }
  ],
  metadata: {
    generated_at: new Date().toISOString(),
    ai_confidence: 0.91,
    processing_time: '1.7s',
    total_components: 3,
    word_count: 187,
    meeting_type: 'hiring_decision',
    suggestions: [
      {
        type: 'follow_up_question',
        text: 'What if Maria declines our offer?'
      },
      {
        type: 'follow_up_question',
        text: 'How will this affect our Q2 product timeline?'
      },
      {
        type: 'follow_up_question',
        text: 'Can we adjust the budget for this higher salary?'
      }
    ]
  }
};

// Mock user data for testing
export const MOCK_USER = {
  id: 'user-123',
  name: 'John Doe',
  email: 'john.doe@example.com',
  role: 'hiring_manager',
  preferences: {
    theme: 'light',
    notifications: true,
    defaultView: 'summary'
  }
};

// Mock documents list for testing
export const MOCK_DOCUMENTS = [
  {
    id: 'doc-1',
    name: 'Senior_Developer_Hiring_Decision_Meeting.pdf',
    size: 892456,
    uploaded: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    type: 'hiring_decision',
    processed: true,
    session_id: 'session-1'
  }
];

// Mock chat history for testing
export const MOCK_CHAT_HISTORY = [
  {
    id: 'msg-1',
    type: 'system',
    content: 'Welcome to AI Meeting Summarizer. Upload a document to get started.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    id: 'msg-2',
    type: 'system',
    content: 'Document uploaded and processed successfully: Senior_Developer_Hiring_Decision_Meeting.pdf',
    timestamp: new Date(Date.now() - 28 * 60 * 1000).toISOString()
  },
  {
    id: 'msg-3',
    type: 'user',
    content: 'Who is the top candidate and what are their qualifications?',
    timestamp: new Date(Date.now() - 26 * 60 * 1000).toISOString()
  },
  {
    id: 'msg-4',
    type: 'assistant',
    content: 'The top candidate is Maria Rodriguez, who brings 8 years of Python/Django experience with strong microservices background. She impressed the technical panel with her system design approach and has excellent communication skills.',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString()
  }
];

// Mock settings for testing
export const MOCK_SETTINGS = {
  theme: 'light',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  notificationsEnabled: true,
  defaultDocumentView: 'components',
  chatPanelExpanded: true,
  animationsEnabled: true,
  autoSaveEnabled: true,
  autoSaveInterval: 5, // minutes
  maxRecentDocuments: 5
};