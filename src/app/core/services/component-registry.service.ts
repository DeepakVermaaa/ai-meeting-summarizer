// It maps AG-UI component types to actual Angular components and handles fallbacks

import { Injectable, Type, ComponentRef, ViewContainerRef } from '@angular/core';
import { ComponentType } from '../models/agui.models';
import { TextSectionComponent } from '../../shared/components/text-section/text-section.component';
import { ChecklistComponent } from '../../shared/components/checklist/checklist.component';
import { AlertListComponent } from 'src/app/shared/components/alert-list/alert-list.component';
import { TimelineComponent } from 'src/app/shared/components/timeline/timeline.component';
import { MetricsGridComponent } from 'src/app/shared/components/metrics-grid/metrics-grid.component';
import { StatusCardsComponent } from 'src/app/shared/components/status-cards/status-cards.component';
import { AguiMetadata, BaseComponentData } from '../models/component.models';

/**
 * Interface that all dynamic components must implement
 * This ensures consistent communication between the renderer and components
 */
export interface DynamicComponent {
  /**
   * Component data - contains both component-specific data and AG-UI metadata
   * Must be compatible with BaseComponentData and include _agui property
   */
  data: BaseComponentData & { _agui?: AguiMetadata };
  
  /**
   * Callback for when component data changes
   * Used to notify parent components of user modifications
   */
  onDataChange?: (newData: any) => void;
  
  /**
   * Callback for user interactions
   * Used to handle clicks, selections, and other user events
   */
  onInteraction?: (event: any) => void;
}

/**
 * Metadata about each registered component type
 * Contains information needed for dynamic instantiation and fallback handling
 */
export interface ComponentMetadata {
  componentClass: Type<DynamicComponent>; // The actual Angular component class
  fallbackType?: ComponentType; // What to render if this component fails
  requiresInteraction: boolean; // Whether this component needs user interaction
  category: string; // Component category for organization
  displayName: string; // Human-readable name for the component
  description: string; // Description of what this component does
}

/**
 * Result of component creation process
 * Contains the created component and metadata about the creation
 */
export interface ComponentCreationResult {
  componentRef: ComponentRef<DynamicComponent>; // Reference to the created component
  metadata: ComponentMetadata; // Metadata about the component type
  wasOriginalType: boolean; // Whether we used the requested type or fell back
  actualType: ComponentType; // The actual component type that was created
}

@Injectable({
  providedIn: 'root' // Singleton service available throughout the app
})
export class ComponentRegistryService {
  
  /**
   * Registry mapping component types to their metadata
   * This is the core mapping that enables dynamic component rendering
   */
  private readonly componentRegistry = new Map<ComponentType, ComponentMetadata>();
  
  /**
   * Default fallback component type when all else fails
   * This ensures we always have something to render
   */
  private readonly DEFAULT_FALLBACK: ComponentType = 'text_section';
  
  constructor() {
    this.initializeRegistry();
  }

/**
 * Initialize the component registry with all available component types
 * This is where we register all our dynamic components
 */
private initializeRegistry(): void {
  // Register the Text Section component as our foundation component
  this.registerComponent('text_section', TextSectionComponent, {
    requiresInteraction: true,
    category: 'content',
    displayName: 'Text Section',
    description: 'Displays formatted text content with optional key points and metadata'
  });

  // Register the Checklist component for action items and tasks
  this.registerComponent('checklist', ChecklistComponent, {
    requiresInteraction: true,
    category: 'action',
    displayName: 'Checklist',
    description: 'Interactive task list with checkboxes, progress tracking, and status management'
  });

  // Register the Alert List component for risks and issues
  this.registerComponent('alert_list', AlertListComponent, {
    requiresInteraction: true,
    category: 'risk',
    displayName: 'Alert List',
    description: 'Interactive alerts, risks, and issues with severity levels and status tracking'
  });

  // Register the Timeline component for chronological events
  this.registerComponent('timeline', TimelineComponent, {
    requiresInteraction: true,
    category: 'outcome',
    displayName: 'Timeline',
    description: 'Chronological view of events, milestones, and deadlines with status tracking'
  });

  // Register the Metrics Grid component for KPIs and metrics
  this.registerComponent('metrics_grid', MetricsGridComponent, {
    requiresInteraction: true,
    category: 'outcome',
    displayName: 'Metrics Grid',
    description: 'Grid of key performance indicators, statistics, and metrics with trend visualization'
  });

  // Register the Status Cards component for status overviews
  this.registerComponent('status_cards', StatusCardsComponent, {
    requiresInteraction: true,
    category: 'overview',
    displayName: 'Status Cards',
    description: 'Status overview cards for departments, projects, or features with progress tracking'
  });
}

  /**
   * Register a new component type in the registry
   * This is how we add new dynamic components to the system
   * 
   * @param type - The AG-UI component type identifier
   * @param componentClass - The Angular component class to instantiate
   * @param metadata - Additional metadata about the component
   */
  public registerComponent(
    type: ComponentType, 
    componentClass: Type<DynamicComponent>, 
    metadata: Partial<ComponentMetadata>
  ): void {
    const fullMetadata: ComponentMetadata = {
      componentClass,
      requiresInteraction: metadata.requiresInteraction ?? false,
      category: metadata.category ?? 'general',
      displayName: metadata.displayName ?? type,
      description: metadata.description ?? `Dynamic ${type} component`,
      fallbackType: metadata.fallbackType
    };

    this.componentRegistry.set(type, fullMetadata);
  }

  /**
   * Create a dynamic component instance in the specified container
   * This is the main method that creates components from AG-UI data
   * 
   * @param type - The component type to create
   * @param container - Where to create the component
   * @param data - Data to pass to the component
   * @returns Promise with the creation result
   */
  public async createComponent(
    type: ComponentType,
    container: ViewContainerRef,
    data: any
  ): Promise<ComponentCreationResult> {
    // Try to get the requested component type
    let metadata = this.componentRegistry.get(type);
    let actualType = type;
    let wasOriginalType = true;

    // If component type not found, try fallback chain
    if (!metadata) {
      const fallbackResult = this.findFallbackComponent(type);
      metadata = fallbackResult.metadata;
      actualType = fallbackResult.type;
      wasOriginalType = false;
    }

    // If still no component found, use default fallback
    if (!metadata) {
      metadata = this.componentRegistry.get(this.DEFAULT_FALLBACK);
      actualType = this.DEFAULT_FALLBACK;
      wasOriginalType = false;

      // If even default fallback not found, we have a serious problem
      if (!metadata) {
        throw new Error(`ComponentRegistryService: Default fallback component '${this.DEFAULT_FALLBACK}' not registered!`);
      }
    }

    try {
      // Create the component instance
      const componentRef = container.createComponent(metadata.componentClass);
      
      // Pass data to the component
      componentRef.instance.data = data;
      
      // Set up interaction callbacks if the component supports them
      if (componentRef.instance.onDataChange) {
        componentRef.instance.onDataChange = (newData: any) => {
          // TODO: Emit events to parent components or services
        };
      }

      if (componentRef.instance.onInteraction) {
        componentRef.instance.onInteraction = (event: any) => {
          // TODO: Handle user interactions (might trigger API calls)
        };
      }

      // Detect changes to render the component
      componentRef.changeDetectorRef.detectChanges();

      const result: ComponentCreationResult = {
        componentRef,
        metadata,
        wasOriginalType,
        actualType
      };

      return result;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Find a suitable fallback component when the requested type is not available
   * This implements the fallback chain logic
   * 
   * @param requestedType - The originally requested component type
   * @returns Object with fallback metadata and type, or null if none found
   */
  private findFallbackComponent(requestedType: ComponentType): { metadata: ComponentMetadata | undefined, type: ComponentType } {
    // Smart fallback logic - all components fall back to text_section
    const fallbackMappings: { [key in ComponentType]?: ComponentType } = {
      'data_table': 'text_section',
      'checklist': 'text_section',
      'alert_list': 'text_section',
      'timeline': 'text_section',
      'metrics_grid': 'text_section',
      'progress_bar': 'text_section',
      'decision_log': 'text_section',
      'people_grid': 'text_section',
      'comparison_table': 'text_section',
      'status_cards': 'text_section'
    };

    const fallbackType = fallbackMappings[requestedType];
    if (fallbackType) {
      const metadata = this.componentRegistry.get(fallbackType);
      return { metadata, type: fallbackType };
    }

    return { metadata: undefined, type: requestedType };
  }

  /**
   * Get list of all registered component types
   * Useful for debugging and administration
   * 
   * @returns Array of all registered component types
   */
  public getRegisteredTypes(): ComponentType[] {
    return Array.from(this.componentRegistry.keys());
  }

  /**
   * Get metadata for a specific component type
   * 
   * @param type - The component type to get metadata for
   * @returns Component metadata or undefined if not found
   */
  public getComponentMetadata(type: ComponentType): ComponentMetadata | undefined {
    return this.componentRegistry.get(type);
  }

  /**
   * Check if a component type is registered
   * 
   * @param type - The component type to check
   * @returns True if the component type is registered
   */
  public isComponentRegistered(type: ComponentType): boolean {
    return this.componentRegistry.has(type);
  }

  /**
   * Remove a component type from the registry
   * Useful for dynamic plugin-like scenarios
   * 
   * @param type - The component type to unregister
   */
  public unregisterComponent(type: ComponentType): void {
    this.componentRegistry.delete(type);
  }

  /**
   * Clear all registered components
   * Mainly for testing purposes
   */
  public clearRegistry(): void {
    this.componentRegistry.clear();
  }

  /**
   * Get registry statistics for debugging
   * 
   * @returns Object with registry statistics
   */
  public getRegistryStats(): {
    totalComponents: number;
    componentsByCategory: { [category: string]: number };
    interactiveComponents: number;
  } {
    const stats = {
      totalComponents: this.componentRegistry.size,
      componentsByCategory: {} as { [category: string]: number },
      interactiveComponents: 0
    };

    // Calculate statistics
    for (const [type, metadata] of this.componentRegistry.entries()) {
      // Count by category
      const category = metadata.category;
      stats.componentsByCategory[category] = (stats.componentsByCategory[category] || 0) + 1;

      // Count interactive components
      if (metadata.requiresInteraction) {
        stats.interactiveComponents++;
      }
    }

    return stats;
  }
}