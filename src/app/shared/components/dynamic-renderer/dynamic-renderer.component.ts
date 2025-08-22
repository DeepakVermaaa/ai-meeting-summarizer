// This component takes AG-UI data and renders the appropriate dynamic components
// It's the bridge between AG-UI protocol and our Angular component system

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ViewContainerRef,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ComponentRef
} from '@angular/core';
import { AGUIComponent, AGUIMessage } from '../../../core/models/agui.models';
import { ComponentRegistryService, DynamicComponent, ComponentCreationResult } from '../../../core/services/component-registry.service';

/**
 * Event emitted when user interacts with a dynamic component
 * Used to communicate component interactions back to parent components
 */
export interface ComponentInteractionEvent {
  componentId: string; // ID of the component that triggered the event
  componentType: string; // Type of component
  eventType: string; // Type of interaction (click, change, etc.)
  eventData: any; // Data associated with the interaction
  timestamp: Date; // When the interaction occurred
}

/**
 * Event emitted when component data changes
 * Used for real-time updates and synchronization
 */
export interface ComponentDataChangeEvent {
  componentId: string; // ID of the component with changed data
  componentType: string; // Type of component
  oldData: any; // Previous data state
  newData: any; // New data state
  timestamp: Date; // When the change occurred
}

/**
 * Statistics about the current render state
 * Useful for debugging and monitoring
 */
export interface RenderStatistics {
  totalComponents: number; // Total number of components rendered
  componentsByType: { [type: string]: number }; // Count by component type
  componentsByCategory: { [category: string]: number }; // Count by category
  renderTime: number; // Time taken to render all components (ms)
  fallbacksUsed: number; // Number of components that used fallbacks
}

@Component({
  selector: 'app-dynamic-renderer',
  templateUrl: './dynamic-renderer.component.html',
  styleUrls: ['./dynamic-renderer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush // Performance optimization
})
export class DynamicRendererComponent implements OnInit, OnDestroy, OnChanges {

  /**
   * AG-UI message containing components to render
   * This is the main input that drives the entire rendering process
   */
  @Input() aguiMessage: AGUIMessage | null = null;

  /**
   * Whether to show loading state while rendering components
   * Useful for providing user feedback during component creation
   */
  @Input() showLoading: boolean = false;

  /**
   * Whether to show debug information about rendered components
   * Helpful during development to see what components were created
   */
  @Input() showDebugInfo: boolean = false;

  /**
   * Maximum number of components to render at once
   * Prevents performance issues with very large responses
   */
  @Input() maxComponents: number = 50;

  /**
   * Whether to enable animations for component transitions
   */
  @Input() enableAnimations: boolean = true;

  /**
   * Event emitted when user interacts with any dynamic component
   */
  @Output() componentInteraction = new EventEmitter<ComponentInteractionEvent>();

  /**
   * Event emitted when any component's data changes
   */
  @Output() componentDataChange = new EventEmitter<ComponentDataChangeEvent>();

  /**
   * Event emitted when rendering is complete
   */
  @Output() renderComplete = new EventEmitter<RenderStatistics>();

  /**
   * Event emitted when rendering fails
   */
  @Output() renderError = new EventEmitter<Error>();

  /**
   * ViewContainerRef where dynamic components will be created
   * This is the anchor point for all dynamic component creation
   */
  @ViewChild('dynamicContainer', { read: ViewContainerRef, static: true })
  dynamicContainer!: ViewContainerRef;

  /**
   * Array to keep track of all created component references
   * Needed for cleanup and management
   */
  private createdComponents: ComponentRef<DynamicComponent>[] = [];

  /**
   * Current render statistics
   */
  public renderStats: RenderStatistics = {
    totalComponents: 0,
    componentsByType: {},
    componentsByCategory: {},
    renderTime: 0,
    fallbacksUsed: 0
  };

  /**
   * Whether components are currently being rendered
   */
  public isRendering: boolean = false;

  /**
   * Error that occurred during rendering (if any)
   */
  public renderErrorMessage: string | null = null;

  constructor(
    private componentRegistry: ComponentRegistryService
  ) { }

  ngOnInit(): void {
    // Initialize the renderer
    if (this.aguiMessage) {
      this.renderComponents();
    }
  }

  ngOnDestroy(): void {
    // Clean up all created components to prevent memory leaks
    this.destroyAllComponents();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Re-render when AG-UI message changes
    if (changes['aguiMessage'] && !changes['aguiMessage'].firstChange) {
      this.renderComponents();
    }
  }

  /**
   * Main method to render all components from AG-UI message
   * This orchestrates the entire rendering process
   */
  public async renderComponents(): Promise<void> {
    if (!this.aguiMessage?.components) {
      this.clearComponents();
      return;
    }

    // Start rendering process
    this.isRendering = true;
    this.renderErrorMessage = null;
    const startTime = performance.now();

    try {
      // Clear existing components first
      this.destroyAllComponents();

      // Reset statistics
      this.resetRenderStats();

      // Sort components by priority (lower numbers first)
      const sortedComponents = [...this.aguiMessage.components]
        .sort((a, b) => a.priority - b.priority)
        .slice(0, this.maxComponents); // Limit number of components

      // Render each component
      for (const aguiComponent of sortedComponents) {
        await this.renderSingleComponent(aguiComponent);
      }

      // Calculate final statistics
      const endTime = performance.now();
      this.renderStats.renderTime = endTime - startTime;

      // Emit completion event
      this.renderComplete.emit({ ...this.renderStats });

    } catch (error) {
      this.renderErrorMessage = error instanceof Error ? error.message : 'Unknown rendering error';
      this.renderError.emit(error instanceof Error ? error : new Error(this.renderErrorMessage));
    } finally {
      this.isRendering = false;
    }
  }

  /**
   * Render a single AG-UI component
   * Creates the appropriate Angular component and sets up event handlers
   * 
   * @param aguiComponent - The AG-UI component definition to render
   */
  private async renderSingleComponent(aguiComponent: AGUIComponent): Promise<void> {
    try {
      // Create the component using the registry
      const result: ComponentCreationResult = await this.componentRegistry.createComponent(
        aguiComponent.type,
        this.dynamicContainer,
        aguiComponent.data
      );

      // Store reference for cleanup
      this.createdComponents.push(result.componentRef);

      // Set up component with AG-UI metadata
      this.setupComponentMetadata(result.componentRef, aguiComponent);

      // Set up event handlers
      this.setupComponentEventHandlers(result.componentRef, aguiComponent);

      // Update statistics
      this.updateRenderStats(aguiComponent, result);

    } catch (error) {
      // Log error but continue with other components
      throw new Error(`Failed to render component ${aguiComponent.id} of type ${aguiComponent.type}: ${error}`);
    }
  }

  /**
   * Set up component metadata from AG-UI specification
   * Applies AG-UI specific configuration to the component
   * 
   * @param componentRef - Reference to the created component
   * @param aguiComponent - Original AG-UI component definition
   */
  private setupComponentMetadata(
    componentRef: ComponentRef<DynamicComponent>,
    aguiComponent: AGUIComponent
  ): void {
    const instance = componentRef.instance;

    // Pass AG-UI data to component with proper structure
    instance.data = {
      ...aguiComponent.data,
      // Include AG-UI metadata for component use
      _agui: {
        id: aguiComponent.id,
        type: aguiComponent.type,
        title: aguiComponent.title,
        priority: aguiComponent.priority,
        category: aguiComponent.category,
        spec: aguiComponent.agui_spec
      }
    };

    console.log('Component data after setup:', instance.data);
  }
  
  /**
 * Set up event handlers for component interactions and data changes
 * Creates the communication bridge between components and parent
 * 
 * @param componentRef - Reference to the created component
 * @param aguiComponent - Original AG-UI component definition
 */
private setupComponentEventHandlers(
  componentRef: ComponentRef<DynamicComponent>, 
  aguiComponent: AGUIComponent
): void {
  const instance = componentRef.instance;

  // Set up data change handler
  if (instance.onDataChange) {
    instance.onDataChange = (newData: any) => {
      console.log('Component data changed:', {
        componentId: aguiComponent.id,
        oldData: instance.data,
        newData: newData
      });
      
      const event: ComponentDataChangeEvent = {
        componentId: aguiComponent.id,
        componentType: aguiComponent.type,
        oldData: instance.data,
        newData: newData,
        timestamp: new Date()
      };
      this.componentDataChange.emit(event);
    };
  }

  // Set up interaction handler
  if (instance.onInteraction) {
    instance.onInteraction = (eventData: any) => {
      console.log('Component interaction:', {
        componentId: aguiComponent.id,
        eventType: eventData.type || 'interaction',
        eventData: eventData
      });
      
      const event: ComponentInteractionEvent = {
        componentId: aguiComponent.id,
        componentType: aguiComponent.type,
        eventType: eventData.type || 'interaction',
        eventData: eventData,
        timestamp: new Date()
      };
      this.componentInteraction.emit(event);
    };
  }
}

  /**
   * Update render statistics with information about a rendered component
   * 
   * @param aguiComponent - The AG-UI component that was rendered
   * @param result - Result of the component creation process
   */
  private updateRenderStats(aguiComponent: AGUIComponent, result: ComponentCreationResult): void {
    this.renderStats.totalComponents++;

    // Count by type
    const type = result.actualType;
    this.renderStats.componentsByType[type] = (this.renderStats.componentsByType[type] || 0) + 1;

    // Count by category
    const category = aguiComponent.category;
    this.renderStats.componentsByCategory[category] = (this.renderStats.componentsByCategory[category] || 0) + 1;

    // Track fallbacks
    if (!result.wasOriginalType) {
      this.renderStats.fallbacksUsed++;
    }
  }

  /**
   * Reset render statistics to initial state
   */
  private resetRenderStats(): void {
    this.renderStats = {
      totalComponents: 0,
      componentsByType: {},
      componentsByCategory: {},
      renderTime: 0,
      fallbacksUsed: 0
    };
  }

  /**
   * Destroy all created components and clear the container
   * Important for preventing memory leaks
   */
  private destroyAllComponents(): void {
    // Destroy all component references
    for (const componentRef of this.createdComponents) {
      if (componentRef && !componentRef.destroy) {
        componentRef.destroy();
      }
    }

    // Clear the array
    this.createdComponents = [];

    // Clear the view container
    if (this.dynamicContainer) {
      this.dynamicContainer.clear();
    }
  }

  /**
   * Public method to clear all components
   * Can be called from parent components
   */
  public clearComponents(): void {
    this.destroyAllComponents();
    this.resetRenderStats();
  }

  /**
   * Get component reference by AG-UI component ID
   * Useful for programmatic access to specific components
   * 
   * @param componentId - The AG-UI component ID to find
   * @returns Component reference or null if not found
   */
  public getComponentById(componentId: string): ComponentRef<DynamicComponent> | null {
    return this.createdComponents.find(ref =>
      ref.instance.data?._agui?.id === componentId
    ) || null;
  }

  /**
   * Get all component references of a specific type
   * 
   * @param componentType - The component type to find
   * @returns Array of component references
   */
  public getComponentsByType(componentType: string): ComponentRef<DynamicComponent>[] {
    return this.createdComponents.filter(ref =>
      ref.instance.data?._agui?.type === componentType
    );
  }

  /**
   * Check if renderer has any components
   * 
   * @returns True if any components are currently rendered
   */
  public hasComponents(): boolean {
    return this.createdComponents.length > 0;
  }

  /**
   * Retry rendering after an error
   * Useful for error recovery
   */
  public retryRender(): void {
    if (this.aguiMessage) {
      this.renderComponents();
    }
  }
}