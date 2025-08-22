// Core module configuration - provides singleton services for the entire app

import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

// Import all core services
import { ApiService } from './services/api.service';
import { AguiService } from './services/agui.service';
import { ComponentRegistryService } from './services/component-registry.service';
import { FileUploadService } from './services/file-upload.service';

/**
 * Core Module - Contains singleton services and core functionality
 * This module should only be imported once in the AppModule
 * Provides essential services used throughout the application
 */
@NgModule({
  declarations: [
    // No components declared here - only services
  ],
  imports: [
    CommonModule, // Basic Angular directives (ngIf, ngFor, etc.)
    HttpClientModule, // HTTP client for API communication
  ],
  providers: [
    // Core singleton services - these will be available app-wide
    ApiService, // Handles all HTTP API communication
    AguiService, // Manages AG-UI protocol communication
    ComponentRegistryService, // Manages dynamic component registration
    FileUploadService, // Handles PDF file uploads and processing
    
    // HTTP interceptors can be added here later
    // { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true },
    // { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
  ],
  exports: [
    // Export services so they can be used by other modules
    HttpClientModule, // Re-export for convenience
  ]
})
export class CoreModule {
  
  /**
   * Constructor with guard to prevent multiple imports
   * Ensures CoreModule is only imported once in the root AppModule
   * @param parentModule - Will be null if this is the first import
   */
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error(
        'CoreModule is already loaded. Import it in the AppModule only.'
      );
    }
  }
  
  /**
   * Static method to configure the core module
   * Use this when importing CoreModule in AppModule
   * @returns ModuleWithProviders configuration
   */
  static forRoot() {
    return {
      ngModule: CoreModule,
      providers: [
        // Additional providers can be configured here
        // Environment-specific configurations
        // { provide: 'API_BASE_URL', useValue: environment.apiUrl },
      ]
    };
  }
}