import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { AlertListData, AlertItem } from '../../../core/models/component.models';
import { DynamicComponent } from '../../../core/services/component-registry.service';

/**
 * Enhanced Alert List Component
 * Displays risks, issues, and alerts in a modern card-based layout
 */
@Component({
  selector: 'app-alert-list',
  templateUrl: './alert-list.component.html',
  styleUrls: ['./alert-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertListComponent implements OnInit, DynamicComponent {
  /**
   * Component data passed from AG-UI
   */
  @Input() data: AlertListData & {
    _agui?: {
      id: string;
      type: string;
      title?: string;
      priority: number;
      category: string;
      spec: {
        version: string;
        renderer_hints?: {
          preferred_style?: string;
          interaction_mode?: string;
          layout_preference?: string;
          show_header?: boolean;
          collapsible?: boolean;
        };
      };
    };
  } = {
    id: '',
    alerts: [],
    total_count: 0
  };

  /**
   * Grouped alerts by severity for easier display
   */
  public groupedAlerts: { [key: string]: AlertItem[] } = {
    'critical': [],
    'high': [],
    'medium': [],
    'low': []
  };
  
  /**
   * Whether component is in expanded view
   */
  public isExpanded: boolean = true;

  /**
   * Current filter applied to alerts
   */
  public currentFilter: string = 'all';

  /**
   * Filtered alerts based on current filter
   */
  public filteredAlerts: AlertItem[] = [];

  /**
   * Whether to show descriptions for all alerts
   */
  public showAllDescriptions: boolean = false;

  /**
   * Track which alerts have expanded descriptions
   */
  public expandedDescriptions: Set<string> = new Set<string>();

  /**
   * Callback for data changes (implemented from DynamicComponent)
   */
  public onDataChange?: (newData: any) => void;

  /**
   * Callback for user interactions (implemented from DynamicComponent)
   */
  public onInteraction?: (event: any) => void;

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.initializeComponent();
  }

  /**
   * Initialize component state with proper handling of undefined values
   */
  private initializeComponent(): void {
    // Initialize data if not provided
    if (!this.data) {
      this.data = { id: '', alerts: [], total_count: 0 };
    }

    // Ensure alerts array exists
    if (!this.data.alerts) {
      this.data.alerts = [];
    }
    
    // Set expanded state based on renderer hints if available
    if (this.data?._agui?.spec?.renderer_hints?.preferred_style === 'expanded') {
      this.isExpanded = true;
    } else if (this.data?._agui?.spec?.renderer_hints?.preferred_style === 'compact') {
      this.isExpanded = false;
    }

    // Group alerts by severity
    this.groupAlertsBySeverity();
    
    // Initialize filtered alerts
    this.applyFilter('all');
    
    // Emit initialization event
    this.emitInteraction('alert_list_initialized', {
      componentId: this.data?.id,
      totalAlerts: this.data?.alerts?.length || 0,
      displayMode: this.isExpanded ? 'expanded' : 'compact'
    });
  }

  /**
   * Group alerts by their severity level with safe null checks
   */
  private groupAlertsBySeverity(): void {
    // Reset groups
    this.groupedAlerts = {
      'critical': [],
      'high': [],
      'medium': [],
      'low': []
    };
    
    // Group alerts
    if (this.data?.alerts) {
      for (const alert of this.data.alerts) {
        if (alert.severity && this.groupedAlerts[alert.severity]) {
          this.groupedAlerts[alert.severity].push(alert);
        }
      }
    }
    
    // Update severity breakdown if it doesn't exist
    if (!this.data.severity_breakdown) {
      this.data.severity_breakdown = {
        critical: this.groupedAlerts['critical'].length,
        high: this.groupedAlerts['high'].length,
        medium: this.groupedAlerts['medium'].length,
        low: this.groupedAlerts['low'].length
      };
    }
  }

  /**
   * Apply filter to alerts
   * @param filter - Filter to apply (severity level or 'all')
   */
  public applyFilter(filter: string): void {
    this.currentFilter = filter;
    
    if (!this.data?.alerts) {
      this.filteredAlerts = [];
      return;
    }
    
    if (filter === 'all') {
      this.filteredAlerts = [...this.data.alerts];
    } else {
      this.filteredAlerts = this.data.alerts.filter(alert => alert.severity === filter);
    }
    
    // Notify parent of interaction
    this.emitInteraction('filter_changed', { 
      filter,
      resultCount: this.filteredAlerts.length 
    });
    
    // Trigger change detection
    this.cdr.detectChanges();
  }

  /**
   * Toggle expanded state of component
   */
  public toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
    this.emitInteraction('toggle_expanded', { isExpanded: this.isExpanded });
    this.cdr.detectChanges();
  }

  /**
   * Toggle description visibility for a specific alert
   * @param alertId - ID of alert to toggle
   */
  public toggleDescription(alertId: string): void {
    if (this.expandedDescriptions.has(alertId)) {
      this.expandedDescriptions.delete(alertId);
    } else {
      this.expandedDescriptions.add(alertId);
    }
    
    this.emitInteraction('toggle_description', { 
      alertId, 
      expanded: this.expandedDescriptions.has(alertId) 
    });
    
    this.cdr.detectChanges();
  }

  /**
   * Toggle visibility of all descriptions
   */
  public toggleAllDescriptions(): void {
    this.showAllDescriptions = !this.showAllDescriptions;
    
    if (!this.data?.alerts) return;
    
    if (this.showAllDescriptions) {
      // Add all alert IDs to expanded set
      this.data.alerts.forEach(alert => {
        if (alert?.id) this.expandedDescriptions.add(alert.id);
      });
    } else {
      // Clear the set
      this.expandedDescriptions.clear();
    }
    
    this.emitInteraction('toggle_all_descriptions', { 
      showAll: this.showAllDescriptions 
    });
    
    this.cdr.detectChanges();
  }

  /**
   * Update alert status with safe null checks
   * @param alertId - ID of alert to update
   * @param newStatus - New status to set
   */
  public updateAlertStatus(alertId: string, newStatus: 'open' | 'in_progress' | 'resolved' | 'closed'): void {
    if (!this.data?.alerts) return;
    
    // Find and update the alert
    const alertIndex = this.data.alerts.findIndex(a => a.id === alertId);
    if (alertIndex >= 0) {
      const updatedAlerts = [...this.data.alerts];
      updatedAlerts[alertIndex] = {
        ...updatedAlerts[alertIndex],
        status: newStatus
      };
      
      // Create updated data
      const newData: AlertListData = {
        ...this.data,
        alerts: updatedAlerts
      };
      
      // Emit data change
      if (this.onDataChange) {
        this.onDataChange(newData);
      }
      
      // Update local data and regrouping
      this.data = newData;
      this.groupAlertsBySeverity();
      this.applyFilter(this.currentFilter);
      
      // Notify parent of interaction
      this.emitInteraction('status_updated', { 
        alertId, 
        newStatus,
        alert: updatedAlerts[alertIndex]
      });
    }
  }

  /**
   * Get severity class for styling
   * @param severity - Severity level
   * @returns CSS class for styling
   */
  public getSeverityClass(severity?: string): string {
    switch (severity) {
      case 'critical': return 'severity-critical';
      case 'high': return 'severity-high';
      case 'medium': return 'severity-medium';
      case 'low': return 'severity-low';
      default: return 'severity-medium';
    }
  }

  /**
   * Get status class for styling
   * @param status - Alert status
   * @returns CSS class for styling
   */
  public getStatusClass(status?: string): string {
    switch (status) {
      case 'open': return 'status-open';
      case 'in_progress': return 'status-in-progress';
      case 'resolved': return 'status-resolved';
      case 'closed': return 'status-closed';
      default: return 'status-open';
    }
  }

  /**
   * Get icon for alert type
   * @param type - Alert type
   * @returns Material icon name
   */
  public getAlertTypeIcon(type?: string): string {
    switch (type) {
      case 'risk': return 'warning';
      case 'issue': return 'error';
      case 'blocker': return 'block';
      case 'warning': return 'report_problem';
      case 'info': return 'info';
      default: return 'info';
    }
  }

  /**
   * Get relative time string from ISO date
   * @param dateString - ISO date string
   * @returns Human-readable relative time
   */
  public getRelativeTime(dateString?: string): string {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else if (diffDays < 30) {
        return `${Math.floor(diffDays / 7)} weeks ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      return dateString;
    }
  }

  /**
   * Emit interaction event to parent component
   * @param eventType - Type of interaction
   * @param eventData - Data associated with interaction
   */
  private emitInteraction(eventType: string, eventData: any): void {
    if (this.onInteraction) {
      this.onInteraction({
        type: eventType,
        data: eventData,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get count of alerts by status
   * @param status - Status to count
   * @returns Number of alerts with that status
   */
  public getStatusCount(status: string): number {
    return this.data?.alerts?.filter(a => a.status === status)?.length || 0;
  }

  /**
   * Check if any alert has mitigation info
   * @returns True if any alert has mitigation info
   */
  public hasMitigations(): boolean {
    return this.data?.alerts?.some(a => a.mitigation) || false;
  }

  /**
   * Get formatted count with label
   * @param count - Number to format
   * @param singular - Singular label
   * @param plural - Plural label
   * @returns Formatted string
   */
  public formatCount(count: number, singular: string, plural: string): string {
    return `${count} ${count === 1 ? singular : plural}`;
  }

  /**
   * Get total count of filtered alerts
   * @returns Number of filtered alerts
   */
  public getFilteredCount(): number {
    return this.filteredAlerts?.length || 0;
  }
}