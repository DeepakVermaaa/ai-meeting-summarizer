// src/app/shared/components/status-cards/status-cards.component.ts

import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { StatusCardsData, StatusCard } from '../../../core/models/component.models';
import { DynamicComponent } from '../../../core/services/component-registry.service';

@Component({
  selector: 'app-status-cards',
  templateUrl: './status-cards.component.html',
  styleUrls: ['./status-cards.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusCardsComponent implements OnInit, DynamicComponent {
  /**
   * Component data passed from AG-UI
   */
  @Input() data!: StatusCardsData & {
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
   * Layout mode for cards (grid or row)
   */
  public layoutMode: 'grid' | 'row' = 'grid';

  /**
   * Current status filter
   */
  public statusFilter: string = 'all';

  /**
   * Filtered cards based on current filter
   */
  public filteredCards: StatusCard[] = [];

  /**
   * Callback for data changes (implemented from DynamicComponent)
   */
  public onDataChange?: (newData: any) => void;

  /**
   * Callback for user interactions (implemented from DynamicComponent)
   */
  public onInteraction?: (event: any) => void;

  /**
   * Track if cards are currently being filtered
   */
  public isFiltered: boolean = false;

  /**
   * Unique statuses extracted from cards
   */
  public statuses: string[] = [];

  /**
   * Currently expanded card IDs for detail view
   */
  public expandedCardIds: Set<string> = new Set<string>();

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

    // Extract unique statuses from cards
    this.extractStatuses();

    // Apply filters to initialize filtered cards
    this.applyFilters();
  }

  /**
   * Extract unique statuses from cards
   */
  private extractStatuses(): void {
    if (!this.data?.cards) {
      this.statuses = [];
      return;
    }

    // Get all unique statuses
    const statusSet = new Set<string>();
    
    this.data.cards.forEach(card => {
      if (card.status) {
        statusSet.add(card.status);
      }
    });

    this.statuses = Array.from(statusSet);
  }

  /**
   * Apply filters to cards
   */
  public applyFilters(): void {
    if (!this.data?.cards) {
      this.filteredCards = [];
      return;
    }

    // Apply status filter
    if (this.statusFilter === 'all') {
      this.filteredCards = [...this.data.cards];
      this.isFiltered = false;
    } else {
      this.filteredCards = this.data.cards.filter(card => 
        card.status === this.statusFilter
      );
      this.isFiltered = true;
    }

    // Emit interaction event
    this.emitInteraction('filter_changed', {
      statusFilter: this.statusFilter,
      resultCount: this.filteredCards.length
    });
  }

  /**
   * Change the status filter
   * @param status - New status filter
   */
  public changeStatusFilter(status: string): void {
    this.statusFilter = status;
    this.applyFilters();
  }

  /**
   * Change the layout mode
   * @param mode - New layout mode
   */
  public changeLayoutMode(mode: 'grid' | 'row'): void {
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
   * Toggle card details visibility
   * @param cardId - ID of card to toggle
   */
  public toggleCardDetails(cardId: string): void {
    if (this.expandedCardIds.has(cardId)) {
      this.expandedCardIds.delete(cardId);
    } else {
      this.expandedCardIds.add(cardId);
    }
    
    this.emitInteraction('toggle_card_details', { 
      cardId, 
      expanded: this.expandedCardIds.has(cardId)
    });
  }

  /**
   * Update card status
   * @param cardId - ID of card to update
   * @param newStatus - New status to set
   */
  public updateCardStatus(cardId: string, newStatus: 'on_track' | 'at_risk' | 'blocked' | 'completed' | 'not_started'): void {
    if (!this.data?.cards) return;
    
    // Find and update the card
    const cardIndex = this.data.cards.findIndex(c => c.id === cardId);
    if (cardIndex >= 0) {
      const updatedCards = [...this.data.cards];
      updatedCards[cardIndex] = {
        ...updatedCards[cardIndex],
        status: newStatus
      };
      
      // Create updated data
      const newData: StatusCardsData = {
        ...this.data,
        cards: updatedCards
      };
      
      // Emit data change
      if (this.onDataChange) {
        this.onDataChange(newData);
      }
      
      // Update local data
      this.data = newData;
      
      // Reapply filters
      this.applyFilters();
      
      // Emit interaction event
      this.emitInteraction('status_updated', { 
        cardId, 
        newStatus,
        card: updatedCards[cardIndex]
      });
    }
  }

  /**
   * Update card progress
   * @param cardId - ID of card to update
   * @param newProgress - New progress percentage (0-100)
   */
  public updateCardProgress(cardId: string, newProgress: number): void {
    if (!this.data?.cards) return;
    
    // Ensure progress is within bounds
    const boundedProgress = Math.max(0, Math.min(100, newProgress));
    
    // Find and update the card
    const cardIndex = this.data.cards.findIndex(c => c.id === cardId);
    if (cardIndex >= 0) {
      const updatedCards = [...this.data.cards];
      updatedCards[cardIndex] = {
        ...updatedCards[cardIndex],
        progress: boundedProgress
      };
      
      // Create updated data
      const newData: StatusCardsData = {
        ...this.data,
        cards: updatedCards
      };
      
      // Emit data change
      if (this.onDataChange) {
        this.onDataChange(newData);
      }
      
      // Update local data
      this.data = newData;
      
      // Emit interaction event
      this.emitInteraction('progress_updated', { 
        cardId, 
        progress: boundedProgress,
        card: updatedCards[cardIndex]
      });
    }
  }

  /**
   * Get status class for styling
   * @param status - Card status
   * @returns CSS class for styling
   */
  public getStatusClass(status: string): string {
    switch (status) {
      case 'on_track': return 'status-on-track';
      case 'at_risk': return 'status-at-risk';
      case 'blocked': return 'status-blocked';
      case 'completed': return 'status-completed';
      case 'not_started': return 'status-not-started';
      default: return '';
    }
  }

  /**
   * Get color class for styling
   * @param color - Color name
   * @returns CSS class for styling
   */
  public getColorClass(color: string): string {
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
   * Get icon for card
   * @param icon - Icon name
   * @returns Material icon name or default
   */
  public getCardIcon(icon?: string): string {
    return icon || 'info';
  }

  /**
   * Format relative time from timestamp
   * @param timestamp - ISO date string
   * @returns Human-readable relative time
   */
  public getRelativeTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      return `${Math.round(diffDays / 7)} weeks ago`;
    } else {
      return date.toLocaleDateString();
    }
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
   * Get filtered cards count
   * @returns Number of filtered cards
   */
  public getFilteredCount(): number {
    return this.filteredCards.length;
  }

  /**
   * Get total cards count
   * @returns Total number of cards
   */
  public getTotalCount(): number {
    return this.data?.cards?.length || 0;
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
   * Get count of cards by status
   * @param status - Status to count
   * @returns Number of cards with the status
   */
  public getStatusCount(status: string): number {
    return this.data?.cards?.filter(card => card.status === status).length || 0;
  }
}