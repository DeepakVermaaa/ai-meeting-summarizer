// Component-specific data models for different types of meeting components

/**
 * AG-UI metadata interface
 * Contains metadata added by the dynamic renderer
 */
export interface AguiMetadata {
  id: string;
  type: string;
  title: string;
  priority: number;
  category: string;
  spec: {
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
 * Base interface that all component data must implement
 * Provides common structure for all component types
 */
export interface BaseComponentData {
  id: string; // Unique identifier for the component instance
  title?: string; // Optional title for the component
  description?: string; // Optional description or subtitle
  last_updated?: string; // When this data was last updated
  _agui?: AguiMetadata; // AG-UI metadata added by dynamic renderer
}

/**
 * Data structure for text section components
 * Used for displaying formatted text content like summaries or notes
 */
export interface TextSectionData extends BaseComponentData {
  content: string; // Main text content (supports HTML/markdown)
  key_points?: string[]; // Array of key bullet points
  sentiment?: 'positive' | 'neutral' | 'negative'; // Tone of the content
  word_count?: number; // Number of words in content
}

/**
 * Data structure for data table components
 * Used for displaying tabular information like task lists or comparisons
 */
export interface DataTableData extends BaseComponentData {
  headers: string[]; // Column headers for the table
  rows: (string | number)[]; // Array of row data
  sortable?: boolean; // Whether columns can be sorted
  filterable?: boolean; // Whether table can be filtered
  total_rows?: number; // Total number of rows (for pagination)
  column_types?: ('text' | 'number' | 'date' | 'status')[]; // Data types for each column
}

/**
 * Data structure for checklist components
 * Used for action items, tasks, and todo lists
 */
export interface ChecklistData extends BaseComponentData {
  items: ChecklistItem[]; // Array of checklist items
  total_items: number; // Total number of items
  completed: number; // Number of completed items
  show_progress?: boolean; // Whether to show progress bar
}

/**
 * Individual item in a checklist
 */
export interface ChecklistItem {
  id: string; // Unique identifier for the item
  task: string; // Task description
  owner?: string; // Person responsible for the task
  due_date?: string; // When task is due (ISO date string)
  priority: 'high' | 'medium' | 'low'; // Task priority level
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'; // Current status
  dependencies?: string[]; // IDs of other tasks this depends on
  estimated_hours?: number; // Estimated time to complete
  tags?: string[]; // Optional tags for categorization
}

/**
 * Data structure for alert list components
 * Used for displaying risks, issues, warnings, and important notices
 */
export interface AlertListData extends BaseComponentData {
  alerts: AlertItem[]; // Array of alert items
  total_count: number; // Total number of alerts
  severity_breakdown?: { // Count by severity level
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

/**
 * Individual alert item
 */
export interface AlertItem {
  id: string; // Unique identifier for the alert
  type: 'risk' | 'issue' | 'blocker' | 'warning' | 'info'; // Type of alert
  severity: 'critical' | 'high' | 'medium' | 'low'; // Severity level
  title: string; // Alert title/summary
  description: string; // Detailed description
  mitigation?: string; // Suggested mitigation or solution
  owner?: string; // Person responsible for addressing
  due_date?: string; // When this needs to be resolved
  status?: 'open' | 'in_progress' | 'resolved' | 'closed'; // Current status
  created_date: string; // When alert was created
}

/**
 * Data structure for timeline components
 * Used for displaying project milestones, schedules, and chronological events
 */
export interface TimelineData extends BaseComponentData {
  events: TimelineEvent[]; // Array of timeline events
  start_date: string; // Timeline start date
  end_date: string; // Timeline end date
  view_mode?: 'monthly' | 'weekly' | 'daily'; // Display granularity
}

/**
 * Individual event in a timeline
 */
export interface TimelineEvent {
  id: string; // Unique identifier for the event
  date: string; // Event date (ISO date string)
  milestone: string; // Event title/milestone name
  description?: string; // Detailed description
  status: 'upcoming' | 'in_progress' | 'completed' | 'delayed' | 'cancelled'; // Event status
  owner?: string; // Person responsible
  dependencies?: string[]; // Other events this depends on
  type?: 'milestone' | 'deadline' | 'meeting' | 'deliverable'; // Event type
}

/**
 * Data structure for metrics grid components
 * Used for displaying KPIs, statistics, and performance indicators
 */
export interface MetricsGridData extends BaseComponentData {
  metrics: MetricItem[]; // Array of metric items
  layout?: 'grid' | 'list'; // Display layout preference
  refresh_interval?: number; // Auto-refresh interval in seconds
  source?: string; // Source of the metrics data
  last_updated?: string; // When metrics data was last updated
}

/**
 * Individual metric item
 */
export interface MetricItem {
  id: string; // Unique identifier for the metric
  label: string; // Metric name/label
  value: string | number; // Current value
  unit?: string; // Unit of measurement (e.g., "%", "hours", "points")
  trend?: 'up' | 'down' | 'stable'; // Trend direction
  previous_value?: string | number; // Previous value for comparison
  target?: string | number; // Target or goal value
  color?: 'green' | 'yellow' | 'red' | 'blue' | 'gray'; // Color coding
  icon?: string; // Optional icon name
  description?: string; // Additional context
  category?: string; // Category for grouping and filtering
}

/**
 * Data structure for status cards components
 * Used for displaying department/project status overviews
 */
export interface StatusCardsData extends BaseComponentData {
  cards: StatusCard[]; // Array of status cards
  layout?: 'grid' | 'row'; // Display layout
}

/**
 * Individual status card
 */
export interface StatusCard {
  id: string; // Unique identifier for the card
  title: string; // Card title
  status: 'on_track' | 'at_risk' | 'blocked' | 'completed' | 'not_started'; // Status
  value?: string; // Main value to display
  description?: string; // Additional description
  color: 'green' | 'yellow' | 'red' | 'blue' | 'gray'; // Color coding
  icon?: string; // Optional icon name
  last_updated: string; // When status was last updated
  progress?: number; // Progress percentage (0-100)
  details?: { // Additional details
    key: string;
    value: string;
  }[];
}