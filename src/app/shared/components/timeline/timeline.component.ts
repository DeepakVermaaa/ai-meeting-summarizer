import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { TimelineData, TimelineEvent } from '../../../core/models/component.models';
import { DynamicComponent } from '../../../core/services/component-registry.service';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimelineComponent implements OnInit, DynamicComponent {
  /**
   * Component data passed from AG-UI
   */
  @Input() data!: TimelineData & {
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
  };

  /**
   * Whether component is in expanded view
   */
  public isExpanded: boolean = true;

  /**
   * Current view mode (monthly, weekly, daily)
   */
  public viewMode: 'monthly' | 'weekly' | 'daily' = 'monthly';

  /**
   * Whether to show details for all events
   */
  public showAllDetails: boolean = false;

  /**
   * Tracks expanded event details
   */
  public expandedEvents: Set<string> = new Set<string>();

  /**
   * Currently selected event
   */
  public selectedEvent: TimelineEvent | null = null;

  /**
   * Filtered events based on current filters
   */
  public filteredEvents: TimelineEvent[] = [];

  /**
   * Current status filter
   */
  public statusFilter: string = 'all';

  /**
   * Callback for data changes (implemented from DynamicComponent)
   */
  public onDataChange?: (newData: any) => void;

  /**
   * Callback for user interactions (implemented from DynamicComponent)
   */
  public onInteraction?: (event: any) => void;

  /**
   * Track if timeline is currently being filtered
   */
  public isFiltered: boolean = false;

  /**
   * Date groupings for events
   */
  public dateGroups: { [key: string]: TimelineEvent[] } = {};

  constructor() { }

  ngOnInit(): void {
    this.initializeComponent();
  }

  /**
   * Initialize component state
   */
  private initializeComponent(): void {
    // Set expanded state based on renderer hints if available
    if (this.data?._agui?.spec?.renderer_hints?.preferred_style === 'expanded') {
      this.isExpanded = true;
    } else if (this.data?._agui?.spec?.renderer_hints?.preferred_style === 'compact') {
      this.isExpanded = false;
    }

    // Set view mode from data or default to monthly
    this.viewMode = this.data?.view_mode || 'monthly';

    // Filter and group events
    this.applyFilters();
    this.groupEventsByDate();
  }

  /**
   * Group events by date based on view mode
   */
  private groupEventsByDate(): void {
    this.dateGroups = {};

    if (!this.filteredEvents?.length) return;

    this.filteredEvents.forEach(event => {
      const date = new Date(event.date);
      let groupKey: string;

      // Generate group key based on view mode
      switch (this.viewMode) {
        case 'daily':
          groupKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'weekly':
          // Get the Monday of the week
          const day = date.getDay();
          const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
          const monday = new Date(date);
          monday.setDate(diff);
          groupKey = monday.toISOString().split('T')[0]; // Monday's date
          break;
        case 'monthly':
        default:
          groupKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`; // YYYY-MM
          break;
      }

      if (!this.dateGroups[groupKey]) {
        this.dateGroups[groupKey] = [];
      }

      this.dateGroups[groupKey].push(event);
    });
  }

  /**
   * Apply filters to timeline events
   */
  public applyFilters(): void {
    if (!this.data?.events) {
      this.filteredEvents = [];
      return;
    }

    // Apply status filter
    if (this.statusFilter === 'all') {
      this.filteredEvents = [...this.data.events];
      this.isFiltered = false;
    } else {
      this.filteredEvents = this.data.events.filter(event => event.status === this.statusFilter);
      this.isFiltered = true;
    }

    // Sort events by date
    this.filteredEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Emit interaction event
    this.emitInteraction('filter_changed', {
      statusFilter: this.statusFilter,
      resultCount: this.filteredEvents.length
    });
  }

  /**
   * Change the status filter
   * @param status - New status filter
   */
  public changeStatusFilter(status: string): void {
    this.statusFilter = status;
    this.applyFilters();
    this.groupEventsByDate();
  }

  /**
   * Change the view mode
   * @param mode - New view mode
   */
  public changeViewMode(mode: 'monthly' | 'weekly' | 'daily'): void {
    this.viewMode = mode;

    // Update data with new view mode
    const newData = {
      ...this.data,
      view_mode: mode
    };

    // Emit data change
    if (this.onDataChange) {
      this.onDataChange(newData);
    }

    // Update local data
    this.data = newData;

    // Regroup events
    this.groupEventsByDate();

    // Emit interaction event
    this.emitInteraction('view_mode_changed', { mode });
  }

  /**
   * Toggle expanded state of component
   */
  public toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
    this.emitInteraction('toggle_expanded', { isExpanded: this.isExpanded });
  }

  /**
   * Toggle event details visibility
   * @param eventId - ID of event to toggle
   */
  public toggleEventDetails(eventId: string): void {
    if (this.expandedEvents.has(eventId)) {
      this.expandedEvents.delete(eventId);
    } else {
      this.expandedEvents.add(eventId);
    }

    this.emitInteraction('toggle_event_details', {
      eventId,
      expanded: this.expandedEvents.has(eventId)
    });
  }

  /**
   * Toggle visibility of all event details
   */
  public toggleAllDetails(): void {
    this.showAllDetails = !this.showAllDetails;

    if (this.showAllDetails) {
      // Add all event IDs to expanded set
      this.filteredEvents.forEach(event => this.expandedEvents.add(event.id));
    } else {
      // Clear the set
      this.expandedEvents.clear();
    }

    this.emitInteraction('toggle_all_details', { showAll: this.showAllDetails });
  }

  /**
   * Update event status
   * @param eventId - ID of event to update
   * @param newStatus - New status to set
   */
  public updateEventStatus(eventId: string, newStatus: 'upcoming' | 'in_progress' | 'completed' | 'delayed' | 'cancelled'): void {
    if (!this.data?.events) return;

    // Find and update the event
    const eventIndex = this.data.events.findIndex(e => e.id === eventId);
    if (eventIndex >= 0) {
      const updatedEvents = [...this.data.events];
      updatedEvents[eventIndex] = {
        ...updatedEvents[eventIndex],
        status: newStatus
      };

      // Create updated data
      const newData: TimelineData = {
        ...this.data,
        events: updatedEvents
      };

      // Emit data change
      if (this.onDataChange) {
        this.onDataChange(newData);
      }

      // Update local data
      this.data = newData;

      // Reapply filters and grouping
      this.applyFilters();
      this.groupEventsByDate();

      // Emit interaction event
      this.emitInteraction('status_updated', {
        eventId,
        newStatus,
        event: updatedEvents[eventIndex]
      });
    }
  }

  /**
   * Select an event to show more details
   * @param event - Event to select
   */
  public selectEvent(event: TimelineEvent): void {
    this.selectedEvent = event;
    this.emitInteraction('event_selected', { eventId: event.id });
  }

  /**
   * Clear selected event
   */
  public clearSelectedEvent(): void {
    this.selectedEvent = null;
    this.emitInteraction('event_deselected', {});
  }

  /**
   * Get status class for styling
   * @param status - Event status
   * @returns CSS class for styling
   */
  public getStatusClass(status: string): string {
    switch (status) {
      case 'upcoming': return 'status-upcoming';
      case 'in_progress': return 'status-in-progress';
      case 'completed': return 'status-completed';
      case 'delayed': return 'status-delayed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-upcoming';
    }
  }

  /**
   * Get icon for event type
   * @param type - Event type
   * @returns Material icon name
   */
  public getEventTypeIcon(type?: string): string {
    switch (type) {
      case 'milestone': return 'flag';
      case 'deadline': return 'today';
      case 'meeting': return 'groups';
      case 'deliverable': return 'inventory_2';
      default: return 'event';
    }
  }

  /**
   * Format date based on view mode
   * @param dateString - ISO date string
   * @returns Formatted date string
   */
  public formatDate(dateString: string): string {
    const date = new Date(dateString);

    switch (this.viewMode) {
      case 'daily':
        return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      case 'weekly':
        return `Week of ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
      case 'monthly':
      default:
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
    }
  }

  /**
   * Format full date for event details
   * @param dateString - ISO date string
   * @returns Formatted date string
   */
  public formatFullDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Get formatted date group header
   * @param groupKey - Date group key
   * @returns Formatted date header
   */
  public getDateGroupHeader(groupKey: string): string {
    const date = new Date(groupKey);

    switch (this.viewMode) {
      case 'daily':
        return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      case 'weekly':
        // Calculate end of week (Sunday)
        const endOfWeek = new Date(date);
        endOfWeek.setDate(date.getDate() + 6);
        return `Week of ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'monthly':
      default:
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
    }
  }

  /**
   * Get relative time from now
   * @param dateString - ISO date string
   * @returns Human readable relative time
   */
  public getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays === -1) {
      return 'Yesterday';
    } else if (diffDays > 0 && diffDays < 7) {
      return `In ${diffDays} days`;
    } else if (diffDays < 0 && diffDays > -7) {
      return `${Math.abs(diffDays)} days ago`;
    } else if (diffDays > 0 && diffDays < 30) {
      return `In ${Math.round(diffDays / 7)} weeks`;
    } else if (diffDays < 0 && diffDays > -30) {
      return `${Math.round(Math.abs(diffDays) / 7)} weeks ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Check if date is in the past
   * @param dateString - ISO date string
   * @returns True if date is in the past
   */
  public isDatePast(dateString: string): boolean {
    const date = new Date(dateString);
    return date.getTime() < new Date().getTime();
  }

  /**
   * Get status count
   * @param status - Status to count
   * @returns Number of events with that status
   */
  public getStatusCount(status: string): number {
    return this.data?.events?.filter(e => e.status === status)?.length || 0;
  }

  /**
   * Emit interaction event to parent
   * @param eventType - Type of interaction
   * @param eventData - Event data
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
   * Get total count of filtered events
   * @returns Number of filtered events
   */
  public getFilteredCount(): number {
    return this.filteredEvents.length;
  }

  /**
   * Get total events count
   * @returns Total number of events
   */
  public getTotalCount(): number {
    return this.data?.events?.length || 0;
  }

  /**
   * Get event name by ID
   * @param id - Event ID to lookup
   * @returns Event milestone/title or undefined if not found
   */
  public getEventNameById(id: string): string | undefined {
    return this.data?.events?.find(e => e.id === id)?.milestone;
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
}