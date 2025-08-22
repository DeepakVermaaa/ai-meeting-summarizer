import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AGUIMessage, AGUIComponent } from '../models/agui.models';

/**
 * AG-UI Service
 * Handles AG-UI protocol operations and transformations
 */
@Injectable({
  providedIn: 'root'
})
export class AguiService {
  constructor() {}

  /**
   * Validate an AG-UI message structure
   * @param message - AG-UI message to validate
   * @returns True if the message is valid
   */
  validateAguiMessage(message: AGUIMessage): boolean {
    // Basic validation
    if (!message || !message.components || !Array.isArray(message.components)) {
      return false;
    }
    
    // Validate version
    if (!message.version || message.version !== '1.0') {
      console.warn('Unsupported AG-UI version:', message.version);
      return false;
    }
    
    // Validate components
    for (const component of message.components) {
      if (!this.validateComponent(component)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Validate an individual AG-UI component
   * @param component - Component to validate
   * @returns True if the component is valid
   */
  private validateComponent(component: AGUIComponent): boolean {
    // Check required fields
    if (!component.id || !component.type) {
      return false;
    }
    
    // Check that data exists
    if (!component.data) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Filter components by category
   * @param message - AG-UI message to filter
   * @param category - Category to filter by
   * @returns New AG-UI message with filtered components
   */
  filterByCategory(message: AGUIMessage, category: string): AGUIMessage {
    if (!this.validateAguiMessage(message)) {
      return message;
    }
    
    const filteredComponents = message.components?.filter(
      component => component.category === category
    ) || [];
    
    return {
      ...message,
      components: filteredComponents
    };
  }
  
  /**
   * Filter components by type
   * @param message - AG-UI message to filter
   * @param type - Component type to filter by
   * @returns New AG-UI message with filtered components
   */
  filterByType(message: AGUIMessage, type: string): AGUIMessage {
    if (!this.validateAguiMessage(message)) {
      return message;
    }
    
    const filteredComponents = message.components?.filter(
      component => component.type === type
    ) || [];
    
    return {
      ...message,
      components: filteredComponents
    };
  }
  
  /**
   * Find a component by ID
   * @param message - AG-UI message to search
   * @param componentId - ID of the component to find
   * @returns The component or undefined if not found
   */
  findComponentById(message: AGUIMessage, componentId: string): AGUIComponent | undefined {
    if (!this.validateAguiMessage(message)) {
      return undefined;
    }
    
    return message.components?.find(component => component.id === componentId);
  }
  
  /**
   * Update a component in the AG-UI message
   * @param message - Original AG-UI message
   * @param updatedComponent - Updated component
   * @returns New AG-UI message with the updated component
   */
  updateComponent(message: AGUIMessage, updatedComponent: AGUIComponent): AGUIMessage {
    if (!this.validateAguiMessage(message)) {
      return message;
    }
    
    const componentIndex = message.components?.findIndex(
      component => component.id === updatedComponent.id
    ) ?? -1;
    
    if (componentIndex === -1) {
      return message;
    }
    
    const updatedComponents = [...(message.components || [])];
    updatedComponents[componentIndex] = updatedComponent;
    
    return {
      ...message,
      components: updatedComponents
    };
  }
  
  /**
   * Get statistics about the AG-UI message
   * @param message - AG-UI message to analyze
   * @returns Object with statistics
   */
  getMessageStats(message: AGUIMessage): any {
    if (!this.validateAguiMessage(message)) {
      return {
        componentCount: 0,
        componentsByType: {},
        componentsByCategory: {}
      };
    }
    
    // Count components by type
    const componentsByType: { [type: string]: number } = {};
    // Count components by category
    const componentsByCategory: { [category: string]: number } = {};
    
    for (const component of message.components || []) {
      // Count by type
      componentsByType[component.type] = (componentsByType[component.type] || 0) + 1;
      
      // Count by category
      componentsByCategory[component.category] = (componentsByCategory[component.category] || 0) + 1;
    }
    
    return {
      componentCount: message.components?.length || 0,
      componentsByType,
      componentsByCategory
    };
  }
}