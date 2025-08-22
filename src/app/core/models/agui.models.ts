// AG-UI protocol models for component system

/**
 * AG-UI Message - Top level container for components
 * Represents the complete response from the AI system
 */
export interface AGUIMessage {
  version: string;
  type: 'component_render' | 'chat_response';
  session_id: string;
  timestamp: string;
  components?: AGUIComponent[];
  metadata?: {
    generated_at?: string;
    ai_confidence?: number;
    processing_time?: string;
    total_components?: number;
    word_count?: number;
    meeting_type?: string;
    suggestions?: AGUISuggestion[];
  };
}

/**
 * AG-UI Component - Individual UI component within an AG-UI message
 * Represents a specific visualization or interaction element
 */
export interface AGUIComponent {
  id: string;
  type: ComponentType;
  title: string;
  priority: number;
  category: string;
  data: any; // Component-specific data
  agui_spec: {
    version: string;
    renderer_hints?: {
      preferred_style?: 'compact' | 'expanded' | 'minimal';
      interaction_mode?: 'interactive' | 'readonly';
      layout_preference?: 'list' | 'grid' | 'cards';
      show_header?: boolean;
      collapsible?: boolean;
    };
  };
}

/**
 * AG-UI Suggestion - Suggested follow-up actions or questions
 * Used to guide user interactions
 */
export interface AGUISuggestion {
  type: 'follow_up_question' | 'action' | 'filter';
  text: string;
  metadata?: {
    priority?: number;
    category?: string;
    target_component_id?: string;
  };
}

/**
 * Component Types - Available component types in the system
 * Mapped to actual Angular components by the ComponentRegistryService
 */
export type ComponentType = 
  | 'text_section'
  | 'data_table'
  | 'checklist'
  | 'alert_list'
  | 'timeline'
  | 'metrics_grid'
  | 'status_cards'
  | 'progress_bar'
  | 'decision_log'
  | 'people_grid'
  | 'comparison_table';