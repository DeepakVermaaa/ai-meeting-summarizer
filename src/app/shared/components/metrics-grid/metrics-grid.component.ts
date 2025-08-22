import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { MetricsGridData, MetricItem } from '../../../core/models/component.models';
import { DynamicComponent } from '../../../core/services/component-registry.service';

@Component({
  selector: 'app-metrics-grid',
  templateUrl: './metrics-grid.component.html',
  styleUrls: ['./metrics-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetricsGridComponent implements OnInit, DynamicComponent {
  /**
   * Component data passed from AG-UI
   */
  @Input() data!: MetricsGridData & {
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
   * Layout mode for metrics (grid or list)
   */
  public layoutMode: 'grid' | 'list' = 'grid';

  /**
   * Current category filter
   */
  public categoryFilter: string = 'all';

  /**
   * Filtered metrics based on current filter
   */
  public filteredMetrics: MetricItem[] = [];

  /**
   * Callback for data changes (implemented from DynamicComponent)
   */
  public onDataChange?: (newData: any) => void;

  /**
   * Callback for user interactions (implemented from DynamicComponent)
   */
  public onInteraction?: (event: any) => void;

  /**
   * Track if metrics are currently being filtered
   */
  public isFiltered: boolean = false;

  /**
   * Unique categories extracted from metrics
   */
  public categories: string[] = [];

  /**
   * Current sort method
   */
  public sortMethod: 'none' | 'value-asc' | 'value-desc' | 'alpha-asc' | 'alpha-desc' = 'none';

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

    // Set layout mode from data or default to grid
    this.layoutMode = this.data?.layout || 'grid';

    // Extract categories from metrics
    this.extractCategories();

    // Apply filters to initialize filtered metrics
    this.applyFilters();
  }

  /**
   * Extract unique categories from metrics
   */
  private extractCategories(): void {
    if (!this.data?.metrics) {
      this.categories = [];
      return;
    }

    // Get all categories by looking for tags in metrics
    const categorySet = new Set<string>();
    
    this.data.metrics.forEach(metric => {
      if (metric.category) {
        categorySet.add(metric.category);
      }
    });

    this.categories = Array.from(categorySet);
  }

  /**
   * Apply filters to metrics
   */
  public applyFilters(): void {
    if (!this.data?.metrics) {
      this.filteredMetrics = [];
      return;
    }

    // Apply category filter
    if (this.categoryFilter === 'all') {
      this.filteredMetrics = [...this.data.metrics];
      this.isFiltered = false;
    } else {
      this.filteredMetrics = this.data.metrics.filter(metric => 
        metric.category === this.categoryFilter
      );
      this.isFiltered = true;
    }

    // Apply sorting
    this.sortMetrics();

    // Emit interaction event
    this.emitInteraction('filter_changed', {
      categoryFilter: this.categoryFilter,
      sortMethod: this.sortMethod,
      resultCount: this.filteredMetrics.length
    });
  }

  /**
   * Sort metrics based on current sort method
   */
  private sortMetrics(): void {
    switch (this.sortMethod) {
      case 'value-asc':
        this.filteredMetrics.sort((a, b) => this.getNumericValue(a.value) - this.getNumericValue(b.value));
        break;
      case 'value-desc':
        this.filteredMetrics.sort((a, b) => this.getNumericValue(b.value) - this.getNumericValue(a.value));
        break;
      case 'alpha-asc':
        this.filteredMetrics.sort((a, b) => a.label.localeCompare(b.label));
        break;
      case 'alpha-desc':
        this.filteredMetrics.sort((a, b) => b.label.localeCompare(a.label));
        break;
      default:
        // Keep original order
        break;
    }
  }

  /**
   * Convert metric value to number for sorting
   * @param value - Metric value (string or number)
   * @returns Numeric value for sorting
   */
  private getNumericValue(value: string | number): number {
    if (typeof value === 'number') {
      return value;
    }
    
    // Try to extract number from string
    const matches = value.match(/(-?\d+(\.\d+)?)/);
    if (matches && matches[0]) {
      return parseFloat(matches[0]);
    }
    
    return 0; // Default value if no number found
  }

  /**
   * Change the category filter
   * @param category - New category filter
   */
  public changeCategoryFilter(category: string): void {
    this.categoryFilter = category;
    this.applyFilters();
  }

  /**
   * Change the sort method
   * @param method - New sort method
   */
  public changeSortMethod(method: 'none' | 'value-asc' | 'value-desc' | 'alpha-asc' | 'alpha-desc'): void {
    this.sortMethod = method;
    this.applyFilters();
  }

  /**
   * Change the layout mode
   * @param mode - New layout mode
   */
  public changeLayoutMode(mode: 'grid' | 'list'): void {
    this.layoutMode = mode;
    
    // Update data with new layout mode
    const newData = {
      ...this.data,
      layout: mode
    };
    
    // Emit data change
    if (this.onDataChange) {
      this.onDataChange(newData);
    }
    
    // Update local data
    this.data = newData;
    
    // Emit interaction event
    this.emitInteraction('layout_changed', { mode });
  }

  /**
   * Toggle expanded state of component
   */
  public toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
    this.emitInteraction('toggle_expanded', { isExpanded: this.isExpanded });
  }

  /**
   * Get trend icon for metric
   * @param trend - Trend direction
   * @returns Material icon name
   */
  public getTrendIcon(trend?: string): string {
    switch (trend) {
      case 'up': return 'trending_up';
      case 'down': return 'trending_down';
      case 'stable': return 'trending_flat';
      default: return 'remove';
    }
  }

  /**
   * Get trend class for styling
   * @param trend - Trend direction
   * @returns CSS class for styling
   */
  public getTrendClass(trend?: string): string {
    switch (trend) {
      case 'up': return 'trend-up';
      case 'down': return 'trend-down';
      case 'stable': return 'trend-stable';
      default: return '';
    }
  }

  /**
   * Get metric icon
   * @param icon - Icon name
   * @returns Material icon name or default
   */
  public getMetricIcon(icon?: string): string {
    return icon || 'insights';
  }

  /**
   * Get CSS color class for metric
   * @param color - Color name
   * @returns CSS class for styling
   */
  public getColorClass(color?: string): string {
    switch (color) {
      case 'green': return 'color-green';
      case 'yellow': return 'color-yellow';
      case 'red': return 'color-red';
      case 'blue': return 'color-blue';
      case 'gray': case 'grey': return 'color-gray';
      default: return '';
    }
  }

  /**
   * Format metric value with unit
   * @param value - Metric value
   * @param unit - Unit of measurement
   * @returns Formatted value with unit
   */
  public formatValueWithUnit(value: string | number, unit?: string): string {
    if (!unit) return `${value}`;
    return `${value} ${unit}`;
  }

  /**
   * Calculate percentage difference between current and previous value
   * @param current - Current value
   * @param previous - Previous value
   * @returns Percentage difference string
   */
  public calculatePercentChange(current: string | number, previous?: string | number): string {
    if (!previous) return '';
    
    const currentNum = this.getNumericValue(current);
    const previousNum = this.getNumericValue(previous);
    
    if (previousNum === 0) return '';
    
    const percentChange = ((currentNum - previousNum) / Math.abs(previousNum)) * 100;
    return `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(1)}%`;
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
   * Get filtered metrics count
   * @returns Number of filtered metrics
   */
  public getFilteredCount(): number {
    return this.filteredMetrics.length;
  }

  /**
   * Get total metrics count
   * @returns Total number of metrics
   */
  public getTotalCount(): number {
    return this.data?.metrics?.length || 0;
  }

  /**
   * Format count with label
   * @param count - Number to format
   * @param singular - Singular label
   * @param plural - Plural label
   * @returns Formatted count string
   */
  public formatCount(count: number, singular: string, plural: string): string {
    return `${count} ${count === 1 ? singular : plural}`;
  }

  /**
   * Check if metric has comparison data
   * @param metric - Metric item
   * @returns True if metric has comparison data
   */
  public hasComparisonData(metric: MetricItem): boolean {
    return !!metric.previous_value || !!metric.target;
  }
}