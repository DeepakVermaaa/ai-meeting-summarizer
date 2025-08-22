import { 
  Component, 
  Input, 
  OnInit, 
  OnChanges, 
  SimpleChanges, 
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  AfterViewInit
} from '@angular/core';
import { DynamicComponent } from '../../../core/services/component-registry.service';
import { ChecklistData, ChecklistItem } from '../../../core/models/component.models';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { trigger, transition, style, animate, state } from '@angular/animations';

/**
 * Enhanced ChecklistComponent - Displays interactive task lists with checkboxes
 * Features:
 * - Smooth animations for expand/collapse
 * - Enhanced filtering and sorting
 * - Improved UI/UX with modern design
 * - Priority-based styling and sorting
 * - Due date indicators with overdue warnings
 * - Interactive bulk actions with visual feedback
 * - Responsive design for all device sizes
 * 
 * Used for: Action items, todo lists, task tracking, meeting follow-ups
 */
@Component({
  selector: 'app-checklist',
  templateUrl: './checklist.component.html',
  styleUrls: ['./checklist.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({ 
        height: '0px',
        opacity: '0',
        overflow: 'hidden'
      })),
      state('expanded', style({ 
        height: '*',
        opacity: '1'
      })),
      transition('collapsed <=> expanded', [
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ])
  ]
})
export class ChecklistComponent implements DynamicComponent, OnInit, OnChanges, AfterViewInit {

  /**
   * Component data from AG-UI message
   * Contains checklist items and configuration
   */
  @Input() data: ChecklistData & { _agui?: any } = {
    id: '',
    items: [],
    total_items: 0,
    completed: 0
  };

  /**
   * Callback for data changes - Required by DynamicComponent interface
   * Called when user modifies checklist data (checks/unchecks items)
   */
  onDataChange?: (newData: any) => void;

  /**
   * Callback for user interactions - Required by DynamicComponent interface
   * Called when user interacts with checklist items or controls
   */
  onInteraction?: (event: any) => void;

  /**
   * Reference to checklist content container for scroll animations
   */
  @ViewChild('checklistContent') checklistContent!: ElementRef;

  /**
   * Display mode from AG-UI renderer hints
   * - compact: Shows only essential info
   * - expanded: Shows all details including metadata
   * - minimal: Shows just the checklist items
   */
  public displayMode: 'compact' | 'expanded' | 'minimal' = 'expanded';

  /**
   * Whether to show the component header with title and actions
   */
  public showHeader: boolean = true;

  /**
   * Whether the component can be collapsed/expanded
   */
  public isCollapsible: boolean = true;

  /**
   * Current expanded state (only relevant if collapsible)
   */
  public isExpanded: boolean = true;

  /**
   * Animation state for expand/collapse
   */
  public animationState: 'expanded' | 'collapsed' = 'expanded';

  /**
   * Whether to show progress bar
   */
  public showProgress: boolean = true;

  /**
   * Current completion percentage (0-100)
   */
  public completionPercentage: number = 0;

  /**
   * Filtered and sorted items for display
   */
  public displayItems: ChecklistItem[] = [];

  /**
   * Current filter settings
   */
  public filters = {
    status: 'all' as 'all' | 'pending' | 'completed' | 'in_progress' | 'blocked',
    priority: 'all' as 'all' | 'high' | 'medium' | 'low',
    showOverdue: false
  };

  /**
   * Current sort settings
   */
  public sortBy: 'priority' | 'due_date' | 'status' | 'task' = 'priority';
  public sortDirection: 'asc' | 'desc' = 'desc';

  /**
   * Whether bulk actions are enabled
   */
  public bulkActionsEnabled: boolean = true;

  /**
   * Selected items for bulk operations
   */
  public selectedItems: Set<string> = new Set();

  /**
   * Whether all items are selected
   */
  public allItemsSelected: boolean = false;

  /**
   * Access Math object for template use
   */
  public Math = Math;

  constructor(private cdr: ChangeDetectorRef, private elementRef: ElementRef) {
    // Initialize with default values to prevent undefined errors
    this.data = {
      id: '',
      items: [],
      total_items: 0,
      completed: 0
    };
  }

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.initializeComponent();
    }
  }

  ngAfterViewInit(): void {
    // Apply any post-render setup that requires DOM access
    setTimeout(() => {
      this.applyItemAnimations();
    }, 0);
  }

  /**
   * Initialize component based on data and AG-UI configuration
   * Sets up display preferences, calculates completion, and processes items
   */
  private initializeComponent(): void {
    if (!this.data) {
      this.data = {
        id: '',
        items: [],
        total_items: 0,
        completed: 0
      };
    }

    // Ensure items array exists
    if (!this.data.items) {
      this.data.items = [];
    }

    // Extract AG-UI configuration
    const aguiConfig = this.data._agui;
    const rendererHints = aguiConfig?.spec?.renderer_hints;

    // Configure display based on AG-UI hints
    this.displayMode = rendererHints?.preferred_style || 'expanded';
    this.isCollapsible = rendererHints?.collapsible ?? true;
    this.showHeader = rendererHints?.show_header ?? true;
    this.showProgress = this.data.show_progress ?? true;

    // Set initial expanded state
    if (this.isCollapsible) {
      this.isExpanded = this.displayMode !== 'minimal';
      this.animationState = this.isExpanded ? 'expanded' : 'collapsed';
    }

    // Update completion statistics
    this.updateCompletionStats();

    // Process and sort items for display
    this.updateDisplayItems();

    // Emit initialization event
    this.emitInteraction('checklist_initialized', {
      componentId: this.data.id,
      totalItems: this.data.total_items,
      completedItems: this.data.completed,
      displayMode: this.displayMode
    });
  }

  /**
   * Apply staggered animations to checklist items
   * Creates a pleasing cascade effect when items are loaded
   */
  private applyItemAnimations(): void {
    const items = this.elementRef.nativeElement.querySelectorAll('.checklist-item');
    items.forEach((item: HTMLElement, index: number) => {
      item.style.animationDelay = `${index * 50}ms`;
    });
  }

  /**
   * Update completion statistics and progress percentage
   * Recalculates based on current item statuses
   */
  private updateCompletionStats(): void {
    if (!this.data?.items || !this.data.items.length) {
      this.completionPercentage = 0;
      this.data.completed = 0;
      this.data.total_items = 0;
      return;
    }

    const completedItems = this.data.items.filter(item => item.status === 'completed').length;
    this.data.completed = completedItems;
    this.data.total_items = this.data.items.length;
    this.completionPercentage = Math.round((completedItems / this.data.items.length) * 100);
  }

  /**
   * Update display items based on current filters and sorting
   * Applies filters first, then sorting
   */
  private updateDisplayItems(): void {
    if (!this.data?.items) {
      this.displayItems = [];
      return;
    }

    let filteredItems = [...this.data.items];

    // Apply status filter
    if (this.filters.status !== 'all') {
      filteredItems = filteredItems.filter(item => item.status === this.filters.status);
    }

    // Apply priority filter
    if (this.filters.priority !== 'all') {
      filteredItems = filteredItems.filter(item => item.priority === this.filters.priority);
    }

    // Apply overdue filter
    if (this.filters.showOverdue) {
      const now = new Date();
      filteredItems = filteredItems.filter(item => {
        if (!item.due_date) return false;
        return new Date(item.due_date) < now && item.status !== 'completed';
      });
    }

    // Apply sorting
    filteredItems.sort((a, b) => {
      let comparison = 0;

      switch (this.sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'due_date':
          if (!a.due_date && !b.due_date) comparison = 0;
          else if (!a.due_date) comparison = 1;
          else if (!b.due_date) comparison = -1;
          else comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          break;
        case 'status':
          const statusOrder = { blocked: 4, pending: 3, in_progress: 2, completed: 1 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        case 'task':
          comparison = a.task.localeCompare(b.task);
          break;
      }

      return this.sortDirection === 'desc' ? -comparison : comparison;
    });

    this.displayItems = filteredItems;
    
    // Reset selection when display items change
    this.resetSelection();
  }

  /**
   * Reset selection state when filters change
   */
  private resetSelection(): void {
    this.selectedItems.clear();
    this.allItemsSelected = false;
  }

  /**
   * Toggle completion status of a checklist item
   * Updates the item status and recalculates completion statistics
   * 
   * @param item - The checklist item to toggle
   * @param event - The checkbox change event
   */
  public toggleItemCompletion(item: ChecklistItem, event: MatCheckboxChange): void {
    const wasCompleted = item.status === 'completed';
    const newStatus = event.checked ? 'completed' : 'pending';
    
    // Update item status
    item.status = newStatus;

    // Update completion stats
    this.updateCompletionStats();

    // Update display items
    this.updateDisplayItems();

    // Trigger change detection
    this.cdr.detectChanges();

    // Emit data change event
    if (this.onDataChange) {
      this.onDataChange(this.data);
    }

    // Emit interaction event
    this.emitInteraction('item_toggled', {
      itemId: item.id,
      task: item.task,
      wasCompleted,
      isCompleted: event.checked,
      newCompletionPercentage: this.completionPercentage
    });
  }

  /**
   * Handle item selection for bulk operations
   * 
   * @param item - The item to select/deselect
   * @param event - The checkbox change event
   */
  public toggleItemSelection(item: ChecklistItem, event: MatCheckboxChange): void {
    if (event.checked) {
      this.selectedItems.add(item.id);
    } else {
      this.selectedItems.delete(item.id);
    }

    // Update all items selected state
    this.allItemsSelected = this.selectedItems.size === this.displayItems.length && this.displayItems.length > 0;

    this.emitInteraction('item_selected', {
      itemId: item.id,
      selected: event.checked,
      totalSelected: this.selectedItems.size
    });
  }

  /**
   * Toggle selection of all visible items
   * 
   * @param event - The checkbox change event
   */
  public toggleAllItemsSelection(event: MatCheckboxChange): void {
    this.selectedItems.clear();
    
    if (event.checked) {
      this.displayItems.forEach(item => this.selectedItems.add(item.id));
    }
    
    this.allItemsSelected = event.checked;

    this.emitInteraction('all_items_selected', {
      selected: event.checked,
      totalSelected: this.selectedItems.size
    });
  }

  /**
   * Mark all selected items as complete
   */
  public markSelectedAsComplete(): void {
    if (!this.data?.items) return;
    
    let changedCount = 0;

    this.data.items.forEach(item => {
      if (this.selectedItems.has(item.id) && item.status !== 'completed') {
        item.status = 'completed';
        changedCount++;
      }
    });

    this.updateCompletionStats();
    this.updateDisplayItems();
    this.selectedItems.clear();
    this.allItemsSelected = false;
    this.cdr.detectChanges();

    if (this.onDataChange) {
      this.onDataChange(this.data);
    }

    this.emitInteraction('bulk_complete', {
      itemsChanged: changedCount,
      newCompletionPercentage: this.completionPercentage
    });
  }

  /**
   * Mark all selected items as incomplete
   */
  public markSelectedAsIncomplete(): void {
    if (!this.data?.items) return;
    
    let changedCount = 0;

    this.data.items.forEach(item => {
      if (this.selectedItems.has(item.id) && item.status === 'completed') {
        item.status = 'pending';
        changedCount++;
      }
    });

    this.updateCompletionStats();
    this.updateDisplayItems();
    this.selectedItems.clear();
    this.allItemsSelected = false;
    this.cdr.detectChanges();

    if (this.onDataChange) {
      this.onDataChange(this.data);
    }

    this.emitInteraction('bulk_incomplete', {
      itemsChanged: changedCount,
      newCompletionPercentage: this.completionPercentage
    });
  }

  /**
   * Apply filter to the checklist
   * 
   * @param filterType - Type of filter to apply
   * @param value - Filter value
   */
  public applyFilter(filterType: string, value: any): void {
    switch (filterType) {
      case 'status':
        this.filters.status = value;
        break;
      case 'priority':
        this.filters.priority = value;
        break;
      case 'overdue':
        this.filters.showOverdue = value;
        break;
    }

    this.updateDisplayItems();
    this.cdr.detectChanges();

    this.emitInteraction('filter_applied', {
      filterType,
      value,
      resultCount: this.displayItems.length
    });
  }

  /**
   * Change sorting of the checklist
   * 
   * @param sortBy - Field to sort by
   */
  public changeSorting(sortBy: 'priority' | 'due_date' | 'status' | 'task'): void {
    if (this.sortBy === sortBy) {
      // Toggle direction if same field
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New field, start with descending
      this.sortBy = sortBy;
      this.sortDirection = 'desc';
    }

    this.updateDisplayItems();
    this.cdr.detectChanges();

    this.emitInteraction('sorting_changed', {
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    });
  }

  /**
   * Toggle expanded/collapsed state
   */
  public toggleExpanded(): void {
    if (!this.isCollapsible) return;

    this.isExpanded = !this.isExpanded;
    this.animationState = this.isExpanded ? 'expanded' : 'collapsed';

    this.emitInteraction('toggle_expanded', {
      isExpanded: this.isExpanded,
      componentId: this.data.id
    });
  }

  /**
   * Copy checklist content to clipboard
   */
  public async copyChecklist(): Promise<void> {
    try {
      const checklistText = this.generateChecklistText();
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(checklistText);
      } else {
        this.fallbackCopyToClipboard(checklistText);
      }

      this.emitInteraction('checklist_copied', {
        componentId: this.data.id,
        itemCount: this.displayItems.length
      });

    } catch (error) {
      this.emitInteraction('copy_failed', {
        componentId: this.data.id,
        error: error
      });
    }
  }

  /**
   * Generate plain text version of checklist
   * 
   * @returns Plain text checklist
   */
  private generateChecklistText(): string {
    const title = this.getTitle();
    let text = title ? `${title}\n${'='.repeat(title.length)}\n\n` : '';
    
    text += `Progress: ${this.completionPercentage}% (${this.data.completed}/${this.data.total_items})\n\n`;

    this.displayItems.forEach((item, index) => {
      const checkbox = item.status === 'completed' ? '[✓]' : '[ ]';
      const priority = item.priority === 'high' ? '🔴' : item.priority === 'medium' ? '🟡' : '🟢';
      text += `${checkbox} ${priority} ${item.task}`;
      
      if (item.owner) text += ` (${item.owner})`;
      if (item.due_date) text += ` - Due: ${this.formatDate(item.due_date)}`;
      
      text += '\n';
    });

    return text;
  }

  /**
   * Fallback clipboard copy method
   * 
   * @param text - Text to copy
   */
  private fallbackCopyToClipboard(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
    } catch (error) {
      throw new Error('Copy operation failed');
    } finally {
      document.body.removeChild(textArea);
    }
  }

  /**
   * Get component title
   * 
   * @returns Component title or default
   */
  public getTitle(): string {
    return this.data._agui?.title || this.data.title || 'Checklist';
  }

  /**
   * Check if component has title
   * 
   * @returns True if has title
   */
  public hasTitle(): boolean {
    return !!(this.data.title || this.data._agui?.title);
  }

  /**
   * Check if component has description
   * 
   * @returns True if has description
   */
  public hasDescription(): boolean {
    return !!this.data.description;
  }

  /**
   * Get priority display class
   * 
   * @param priority - Priority level
   * @returns CSS class for priority
   */
  public getPriorityClass(priority: string): string {
    return `priority-${priority}`;
  }

  /**
   * Get status display class
   * 
   * @param status - Item status
   * @returns CSS class for status
   */
  public getStatusClass(status: string): string {
    return `status-${status}`;
  }

  /**
   * Check if item is overdue
   * 
   * @param item - Checklist item
   * @returns True if overdue
   */
  public isItemOverdue(item: ChecklistItem): boolean {
    if (!item.due_date || item.status === 'completed') return false;
    return new Date(item.due_date) < new Date();
  }

  /**
   * Format date for display
   * 
   * @param dateString - ISO date string
   * @returns Formatted date
   */
  public formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      });
    } catch (error) {
      return dateString;
    }
  }

  /**
   * Get days until due date
   * 
   * @param dateString - ISO date string (optional)
   * @returns Days until due (negative if overdue)
   */
  public getDaysUntilDue(dateString: string | undefined): number {
    if (!dateString) return 0;
    
    try {
      const dueDate = new Date(dateString);
      const today = new Date();
      const diffTime = dueDate.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
      return 0;
    }
  }

  /**
   * Emit interaction event to parent components
   * 
   * @param eventType - Type of interaction
   * @param eventData - Event data
   */
  private emitInteraction(eventType: string, eventData: any): void {
    if (this.onInteraction) {
      this.onInteraction({
        type: eventType,
        timestamp: new Date().toISOString(),
        ...eventData
      });
    }
  }

  /**
   * TrackBy function for checklist items
   * Improves performance for large lists
   * 
   * @param index - Item index
   * @param item - Checklist item
   * @returns Unique identifier
   */
  public trackByItemId(index: number, item: ChecklistItem): string {
    return item.id;
  }
}