// Foundation component that displays formatted text content
// Also serves as the fallback component when other component types fail
// Implements the DynamicComponent interface for compatibility with our renderer

import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { DynamicComponent } from '../../../core/services/component-registry.service';
import { TextSectionData } from '../../../core/models/component.models';

/**
 * Text Section Component
 * Displays formatted text content with optional key points and metadata
 * This is our most basic and versatile component - it can display any text-based content
 */
@Component({
  selector: 'app-text-section',
  templateUrl: './text-section.component.html',
  styleUrls: ['./text-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextSectionComponent implements DynamicComponent, OnInit, OnChanges {

  /**
   * Component data conforming to DynamicComponent interface
   * Contains both TextSectionData and AG-UI metadata
   */
  @Input() data: TextSectionData & { agui_spec?: any } = {
    id: '',
    content: ''
  };

  /**
   * Callback for when component data changes
   * Required by DynamicComponent interface
   */
  onDataChange?: (newData: any) => void;

  /**
   * Callback for user interactions
   * Required by DynamicComponent interface
   */
  onInteraction?: (event: any) => void;

  /**
   * Whether to show the component in expanded mode
   * Controlled by AG-UI renderer hints or user interaction
   */
  public isExpanded: boolean = true;

  /**
   * Whether the component supports collapsing
   * Determined by AG-UI renderer hints
   */
  public isCollapsible: boolean = false;

  /**
   * Display mode for the component
   * Can be 'compact', 'expanded', or 'minimal'
   */
  public displayMode: 'compact' | 'expanded' | 'minimal' = 'expanded';

  /**
   * Whether to show the component header
   */
  public showHeader: boolean = true;

  /**
   * Processed content ready for display
   * May include HTML formatting
   */
  public processedContent: string = '';

  /**
   * CSS classes to apply based on sentiment
   */
  public sentimentClass: string = '';

  /**
   * Whether the content appears to be truncated
   */
  public isTruncated: boolean = false;

  constructor() { }

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.initializeComponent();
    }
  }

  /**
  * Initialize the component based on data and AG-UI settings
  * Fixed to properly handle the _agui structure
  */
  private initializeComponent(): void {
    if (!this.data) return;

    console.log('Initializing with data:', this.data);

    // Set default values
    this.displayMode = 'expanded';
    this.isCollapsible = true;
    this.showHeader = true;

    // Check if _agui property exists
    if (this.data._agui && this.data._agui.spec && this.data._agui.spec.renderer_hints) {
      const rendererHints = this.data._agui.spec.renderer_hints;

      // Apply renderer hints if available
      if (rendererHints.preferred_style) {
        this.displayMode = rendererHints.preferred_style;
      }

      if (rendererHints.collapsible !== undefined) {
        this.isCollapsible = rendererHints.collapsible;
      }

      if (rendererHints.show_header !== undefined) {
        this.showHeader = rendererHints.show_header;
      }
    }

    // Set initial expanded state based on display mode
    if (this.isCollapsible) {
      this.isExpanded = this.displayMode !== 'minimal';
    }

    // Process content for display
    this.processContent();

    // Set sentiment-based styling
    this.setSentimentStyling();

    // Log component state after initialization
    console.log('Component initialized:', {
      displayMode: this.displayMode,
      isCollapsible: this.isCollapsible,
      showHeader: this.showHeader,
      isExpanded: this.isExpanded
    });

    // Notify that component is ready
    this.emitInteraction('component_initialized', {
      componentId: this.data.id,
      displayMode: this.displayMode
    });
  }

  /**
   * Process the text content for display
   * Handles HTML formatting, truncation, and key points extraction
   */
  private processContent(): void {
    if (!this.data.content) {
      this.processedContent = '';
      return;
    }

    let content = this.data.content;

    // Basic HTML sanitization - in a real app, use a proper sanitizer
    content = this.sanitizeContent(content);

    // Handle truncation for compact mode
    if (this.displayMode === 'compact' && content.length > 200) {
      content = content.substring(0, 200) + '...';
      this.isTruncated = true;
    } else {
      this.isTruncated = false;
    }

    this.processedContent = content;
  }

  /**
   * Basic content sanitization
   * In production, use Angular's DomSanitizer or a library like DOMPurify
   * 
   * @param content - Raw content to sanitize
   * @returns Sanitized content
   */
  private sanitizeContent(content: string): string {
    // Basic sanitization - remove script tags and dangerous attributes
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/javascript:/gi, '');
  }

  /**
   * Set CSS classes based on content sentiment
   */
  private setSentimentStyling(): void {
    switch (this.data.sentiment) {
      case 'positive':
        this.sentimentClass = 'sentiment-positive';
        break;
      case 'negative':
        this.sentimentClass = 'sentiment-negative';
        break;
      case 'neutral':
      default:
        this.sentimentClass = 'sentiment-neutral';
        break;
    }
  }

  /**
   * Toggle expanded/collapsed state
   * Only works if the component is collapsible
   */
  public toggleExpanded(): void {
    if (!this.isCollapsible) return;

    this.isExpanded = !this.isExpanded;

    // Reprocess content based on new state
    this.processContent();

    // Emit interaction event
    this.emitInteraction('toggle_expanded', {
      isExpanded: this.isExpanded,
      componentId: this.data.id
    });
  }

  /**
   * Handle click on key point
   * Emits interaction event for parent components to handle
   * 
   * @param keyPoint - The key point that was clicked
   * @param index - Index of the key point in the array
   */
  public onKeyPointClick(keyPoint: string, index: number): void {
    this.emitInteraction('key_point_clicked', {
      keyPoint,
      index,
      componentId: this.data.id
    });
  }

  /**
   * Copy content to clipboard
   * Provides user convenience for sharing content
   */
  public async copyContent(): Promise<void> {
    try {
      // Get plain text content (strip HTML)
      const plainText = this.getPlainTextContent();

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(plainText);
      } else {
        // Fallback for browsers without clipboard API
        this.fallbackCopyToClipboard(plainText);
      }

      this.emitInteraction('content_copied', {
        componentId: this.data.id,
        contentLength: plainText.length
      });

    } catch (error) {
      this.emitInteraction('copy_failed', {
        componentId: this.data.id,
        error: error
      });
    }
  }

  /**
   * Get plain text version of content
   * Strips HTML tags and returns clean text
   * 
   * @returns Plain text content
   */
  private getPlainTextContent(): string {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = this.processedContent;
    return tempDiv.textContent || tempDiv.innerText || '';
  }

  /**
   * Fallback method for copying to clipboard
   * Used when Clipboard API is not available
   * 
   * @param text - Text to copy to clipboard
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
   * Get estimated reading time for the content
   * Assumes average reading speed of 200 words per minute
   * 
   * @returns Estimated reading time in minutes
   */
  public getReadingTime(): number {
    if (!this.data.content) return 0;

    const wordsPerMinute = 200;
    const wordCount = this.data.word_count || this.getWordCount();
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * Calculate word count for content
   * 
   * @returns Number of words in content
   */
  private getWordCount(): number {
    const plainText = this.getPlainTextContent();
    return plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Emit interaction event to parent components
   * 
   * @param eventType - Type of interaction that occurred
   * @param eventData - Additional data about the interaction
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
   * Check if component has any key points to display
   * 
   * @returns True if component has key points
   */
  public hasKeyPoints(): boolean {
    return !!(this.data.key_points && this.data.key_points.length > 0);
  }

  /**
   * Check if component has a title to display
   * 
   * @returns True if component has a title
   */
  public hasTitle(): boolean {
    return !!(this.data.title || this.data.agui_spec?.title);
  }

  /**
   * Get the component title
   * Prefers AG-UI title over data title
   * 
   * @returns Component title or empty string
   */
  public getTitle(): string {
    return this.data.agui_spec?.title || this.data.title || '';
  }

  /**
   * Check if component has a description to display
   * 
   * @returns True if component has a description
   */
  public hasDescription(): boolean {
    return !!this.data.description;
  }

  /**
   * Check if component should show metadata
   * 
   * @returns True if metadata should be shown
   */
  public shouldShowMetadata(): boolean {
    return !!(this.data.word_count || this.data.last_updated || this.data.sentiment);
  }

  /**
   * Get formatted last updated date
   * 
   * @returns Formatted date string or empty string
   */
  public getFormattedLastUpdated(): string {
    if (!this.data.last_updated) return '';

    try {
      const date = new Date(this.data.last_updated);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return this.data.last_updated;
    }
  }

  /**
   * TrackBy function for key points list
   * Improves performance by helping Angular track list items
   * 
   * @param index - Index of the item
   * @param item - The key point item
   * @returns Unique identifier for tracking
   */
  public trackByIndex(index: number, item: string): any {
    return index;
  }
}