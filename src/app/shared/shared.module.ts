import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Angular Material imports
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';

// Import our dynamic components
import { TextSectionComponent } from './components/text-section/text-section.component';
import { DynamicRendererComponent } from './components/dynamic-renderer/dynamic-renderer.component';
import { ChecklistComponent } from './components/checklist/checklist.component';
import { AlertListComponent } from './components/alert-list/alert-list.component';
import { TimelineComponent } from './components/timeline/timeline.component';
import { MetricsGridComponent } from './components/metrics-grid/metrics-grid.component';
import { StatusCardsComponent } from './components/status-cards/status-cards.component';

import { ReplacePipe } from './pipes/replace.pipe';
import { MatMenuModule } from "@angular/material/menu";

/**
 * Shared Module - Contains reusable components and Material modules
 * This module exports components that can be used throughout the application
 */
@NgModule({
  declarations: [
    // Dynamic components for AG-UI rendering
    TextSectionComponent,
    DynamicRendererComponent,
    ChecklistComponent,
    AlertListComponent,
    TimelineComponent,
    MetricsGridComponent,
    StatusCardsComponent,
    ReplacePipe
  ],
  imports: [
    // Angular core modules
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    // Angular Material modules
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatSelectModule,
    MatMenuModule
  ],
  exports: [
    // Re-export Angular core modules for consuming modules
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    // Re-export Angular Material modules for consuming modules
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatSelectModule,
    MatMenuModule,

    // Export our dynamic components so they can be used in other modules
    TextSectionComponent,
    DynamicRendererComponent,
    ChecklistComponent,
    AlertListComponent,
    TimelineComponent,
    MetricsGridComponent,
    StatusCardsComponent,

    // Export pipes
    ReplacePipe,

    // Export the component wrapper
  ]
})
export class SharedModule {
  constructor() {
    console.log('Shared Module loaded');
  }
}