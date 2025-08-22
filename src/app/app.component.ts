import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, HostListener } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { 
  ComponentInteractionEvent, 
  ComponentDataChangeEvent 
} from './shared/components/dynamic-renderer/dynamic-renderer.component';
import { AGUIMessage } from './core/models/agui.models';
import { FileUploadService } from './core/services/file-upload.service';
import { ApiService } from './core/services/api.service';
import { AguiService } from './core/services/agui.service';
import { 
  FileUploadResponse, 
  ProcessDocumentRequest,
  ProcessDocumentResponse, 
  ChatRequest,
  ChatResponse, 
  ChatMessage as ApiChatMessage
} from './core/models/api.models';

/**
 * Chat message interface for the UI
 * Represents messages in the chat panel
 */
interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  isUser: boolean;
}

/**
 * Document information interface
 * Contains metadata about the currently loaded document
 */
interface DocumentInfo {
  id: string;
  fileName: string;
  fileSize: number;
  processedDate: Date;
  sessionId: string;
}

/**
 * Main application component
 * Manages the overall app state and coordinates between panels
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewChecked {
  /** Application title */
  public appTitle = 'MeetingLens';
  
  /** Currently active document */
  public activeDocument: DocumentInfo | null = null;
  
  /** Currently rendered AG-UI message */
  public aguiMessage: AGUIMessage | null = null;
  
  /** Chat messages */
  public chatMessages: ChatMessage[] = [];
  
  /** Current chat input text */
  public chatInputText = '';
  
  /** Whether the chat panel is minimized */
  public isChatMinimized = false;
  
  /** Current chat panel width - UPDATED: Wider default */
  public chatPanelWidth = 480;
  
  /** Whether the application is loading */
  public isLoading = false;
  
  /** Whether components are being loaded */
  public isComponentsLoading = false;
  
  /** Processing progress percentage */
  public processingProgress = 0;
  
  /** Last processing time in seconds */
  public lastProcessingTime = 0;
  
  /** Whether the panel is being resized */
  public isResizing = false;
  
  /** Current view mode for components panel */
  public viewMode: 'grid' | 'list' | 'card' = 'grid';
  
  /** Starting X position for resizing */
  private resizeStartX = 0;
  
  /** Starting width for resizing */
  private resizeStartWidth = 0;
  
  /** Default chat panel width - UPDATED: Wider */
  private readonly DEFAULT_CHAT_WIDTH = 480;
  
  /** Minimum chat panel width */
  private readonly MIN_CHAT_WIDTH = 320;
  
  /** Maximum chat panel width - UPDATED: Extended to 1000px */
  private readonly MAX_CHAT_WIDTH = 1000;
  
  /** Minimized chat panel width */
  private readonly MINIMIZED_CHAT_WIDTH = 80;
  
  /** Reference to chat container for auto-scrolling */
  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  
  /** Flag to indicate if chat should scroll to bottom */
  private shouldScrollToBottom = false;

  /**
   * Constructor with dependency injection
   */
  constructor(
    private fileUploadService: FileUploadService,
    private apiService: ApiService,
    private aguiService: AguiService,
    private snackBar: MatSnackBar
  ) {}

  /**
   * Initialize the component
   */
  ngOnInit(): void {
    // For demo purposes, we might want to show a welcome message
    this.addSystemMessage('Welcome to AI Meeting Summarizer. Upload a PDF meeting document to get started.');
  }
  
  /**
   * After view checked lifecycle hook
   * Used to handle auto-scrolling of chat
   */
  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollChatToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  /**
   * Handle file selection from the file input
   * @param event - File input change event
   */
  onFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      const file = element.files[0];
      
      // Validate file type (PDF only)
      if (file.type !== 'application/pdf') {
        this.showError('Only PDF files are supported');
        return;
      }
      
      this.uploadFile(file);
    }
  }
  
  /**
   * Upload a file to the backend
   * @param file - The file to upload
   */
  private uploadFile(file: File): void {
    this.isLoading = true;
    this.processingProgress = 10;
    
    // Add a system message about file upload
    this.addSystemMessage(`Uploading and processing document: ${file.name}`);
    
    // Call the file upload service
    this.fileUploadService.uploadFile(file).subscribe({
      next: (response: FileUploadResponse) => {
        if (response.success) {
          this.processingProgress = 30;
          // Process the uploaded document
          this.processDocument(response.document_id, response.session_id);
          
          // Update file information
          this.activeDocument = {
            id: response.document_id,
            fileName: response.file_name,
            fileSize: response.file_size,
            processedDate: new Date(),
            sessionId: response.session_id
          };
        } else {
          this.showError('Upload failed: ' + response.message);
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.showError('Upload failed: ' + this.getErrorMessage(error));
        this.isLoading = false;
      }
    });
  }
  
  /**
   * Process the uploaded document
   * @param documentId - ID of the uploaded document
   * @param sessionId - Session ID for the document
   */
  private processDocument(documentId: string, sessionId: string): void {
    this.processingProgress = 50;
    
    const request: ProcessDocumentRequest = {
      session_id: sessionId,
      document_id: documentId,
      processing_options: {
        output_format: 'agui' as const,
        detail_level: 'detailed' as const
      }
    };
    
    this.apiService.processDocument(request).subscribe({
      next: (response: ProcessDocumentResponse) => {
        if (response.success) {
          this.processingProgress = 100;
          this.lastProcessingTime = response.processing_time;
          
          // Store the AG-UI message for rendering
          this.aguiMessage = response.agui_response;
          
          // Add success message to chat
          this.addSystemMessage('Document processed successfully. You can now ask questions about the meeting.');
          
          // If there are suggestions in the AG-UI message, add them as a system message
          if (response.agui_response.metadata?.suggestions?.length) {
            const suggestions = response.agui_response.metadata.suggestions
              .map(s => `• ${s.text}`)
              .join('\n');
            
            this.addSystemMessage(`Here are some questions you might want to ask:\n${suggestions}`);
          }
          
          this.isLoading = false;
        } else {
          this.showError('Processing failed: ' + response.error?.message);
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.showError('Processing failed: ' + this.getErrorMessage(error));
        this.isLoading = false;
      }
    });
  }
  
  /**
   * Send a chat message to the backend
   */
  sendChatMessage(): void {
    if (!this.chatInputText.trim() || !this.activeDocument) {
      return;
    }
    
    // Add user message to the chat
    const userMessage: ChatMessage = {
      id: this.generateId(),
      content: this.chatInputText,
      timestamp: new Date(),
      isUser: true
    };
    
    this.chatMessages.push(userMessage);
    this.shouldScrollToBottom = true;
    
    const question = this.chatInputText;
    this.chatInputText = ''; // Clear input
    
    // Show loading state
    this.isLoading = true;
    
    // Call the chat API
    this.apiService.sendChatRequest({
      session_id: this.activeDocument.sessionId,
      question: question,
      context: {
        current_components: this.aguiMessage?.components?.map(c => c.id) || [],
        conversation_history: this.convertToApiChatMessages()
      }
    }).subscribe({
      next: (response: ChatResponse) => {
        this.isLoading = false;
        
        if (response.success) {
          // Add AI response to chat
          if (response.text_response) {
            this.addAiMessage(response.text_response);
          }
          
          // Handle different response types
          if (response.response_type === 'agui_update' && response.agui_response) {
            // Update the AG-UI message for rendering
            this.aguiMessage = response.agui_response;
            this.lastProcessingTime = response.processing_time;
          } else if (response.response_type === 'filter_applied' && response.filter_info) {
            // Handle filter response
            const filterMessage = `Applied filter: ${Object.keys(response.filter_info.criteria).length} criteria, ${response.filter_info.results_count} results`;
            this.addSystemMessage(filterMessage);
          }
          
          // Add suggestions if available
          if (response.suggestions && response.suggestions.length > 0) {
            const suggestionsText = response.suggestions
              .map(s => `• ${s.text}`)
              .join('\n');
            
            setTimeout(() => {
              this.addSystemMessage(`Follow-up questions you might want to ask:\n${suggestionsText}`);
            }, 1000);
          }
        } else {
          this.showError('Chat request failed: ' + response.error?.message);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.showError('Chat request failed: ' + this.getErrorMessage(error));
      }
    });
  }
  
  /**
   * Start resize operation for panels
   * @param event - Mouse down event
   */
  startResize(event: MouseEvent): void {
    this.isResizing = true;
    this.resizeStartX = event.clientX;
    this.resizeStartWidth = this.chatPanelWidth;
    event.preventDefault();
  }
  
  /**
   * Handle mouse move during resize operation
   * @param event - Mouse move event
   */
  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isResizing) return;
    
    const dx = event.clientX - this.resizeStartX;
    let newWidth = this.resizeStartWidth + dx;
    
    // Apply min/max constraints
    newWidth = Math.max(this.MIN_CHAT_WIDTH, Math.min(this.MAX_CHAT_WIDTH, newWidth));
    
    this.chatPanelWidth = newWidth;
  }
  
  /**
   * End resize operation
   */
  @HostListener('window:mouseup')
  onMouseUp(): void {
    this.isResizing = false;
  }
  
  /**
   * Minimize the chat panel
   */
  minimizeChatPanel(): void {
    this.isChatMinimized = true;
    this.chatPanelWidth = this.MINIMIZED_CHAT_WIDTH;
  }
  
  /**
   * Maximize the chat panel
   */
  maximizeChatPanel(): void {
    this.isChatMinimized = false;
    this.chatPanelWidth = this.DEFAULT_CHAT_WIDTH;
  }
  
  /**
   * Toggle the chat panel expansion state
   */
  toggleChatPanel(): void {
    if (this.isChatMinimized) {
      this.maximizeChatPanel();
    } else {
      this.minimizeChatPanel();
    }
  }
  
  /**
   * Set the view mode for the components panel
   * @param mode - View mode to set
   */
  setViewMode(mode: 'grid' | 'list' | 'card'): void {
    this.viewMode = mode;
  }
  
  /**
   * Convert internal chat messages to API format
   * @returns Array of API-formatted chat messages
   */
  private convertToApiChatMessages(): ApiChatMessage[] {
    return this.chatMessages.map(msg => ({
      id: msg.id,
      type: msg.isUser ? 'user' : 'assistant',
      content: msg.content,
      timestamp: msg.timestamp.toISOString(),
      metadata: {
        session_id: this.activeDocument?.sessionId || ''
      }
    }));
  }
  
  /**
   * Add an AI message to the chat
   * @param content - Message content
   */
  private addAiMessage(content: string): void {
    const message: ChatMessage = {
      id: this.generateId(),
      content,
      timestamp: new Date(),
      isUser: false
    };
    
    this.chatMessages.push(message);
    this.shouldScrollToBottom = true;
  }
  
  /**
   * Add a system message to the chat
   * @param content - Message content
   */
  private addSystemMessage(content: string): void {
    const message: ChatMessage = {
      id: this.generateId(),
      content,
      timestamp: new Date(),
      isUser: false // System messages shown as AI messages
    };
    
    this.chatMessages.push(message);
    this.shouldScrollToBottom = true;
  }
  
  /**
   * Generate a unique ID for chat messages
   * @returns Unique ID string
   */
  private generateId(): string {
    return 'msg_' + Math.random().toString(36).substr(2, 9);
  }
  
  /**
   * Handle component interaction events
   * @param event - Component interaction event
   */
  onComponentInteraction(event: ComponentInteractionEvent): void {
    console.log('Component interaction:', event);
    
    // Handle specific interactions that should affect the chat
    if (event.eventType === 'key_point_clicked') {
      const keyPoint = event.eventData.keyPoint;
      this.chatInputText = `Tell me more about: "${keyPoint}"`;
    }
  }
  
  /**
   * Handle component data change events
   * @param event - Component data change event
   */
  onComponentDataChange(event: ComponentDataChangeEvent): void {
    console.log('Component data changed:', event);
    
    // You might want to sync changes back to the backend
    // This would keep the backend state in sync with user modifications
  }
  
  /**
   * Handle renderer completion
   * @param stats - Render statistics
   */
  onRenderComplete(stats: any): void {
    console.log('Render completed:', stats);
    this.isComponentsLoading = false;
  }
  
  /**
   * Handle renderer errors
   * @param error - Error information
   */
  onRenderError(error: any): void {
    console.error('Render error:', error);
    this.isComponentsLoading = false;
    this.showError('Error rendering components: ' + this.getErrorMessage(error));
  }
  
  /**
   * Refresh the components display
   * Useful if user wants to reset filters or view
   */
  refreshComponents(): void {
    if (!this.activeDocument || !this.aguiMessage) {
      return;
    }
    
    this.isComponentsLoading = true;
    
    // Re-render the same components (this will reset any user-made changes)
    setTimeout(() => {
      this.isComponentsLoading = false;
    }, 500);
  }
  
  /**
   * Clear the current document and reset the app state
   */
  clearDocument(): void {
    this.activeDocument = null;
    this.aguiMessage = null;
    this.chatMessages = [];
    this.processingProgress = 0;
    this.lastProcessingTime = 0;
    this.addSystemMessage('Document cleared. Upload a new document to get started.');
  }
  
  /**
   * Format file size for display
   * @param bytes - File size in bytes
   * @returns Formatted file size string
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * Get component statistics for display
   * @returns Formatted component statistics string
   */
  getComponentStats(): string {
    if (!this.aguiMessage?.components) {
      return 'No components';
    }
    
    const count = this.aguiMessage.components.length;
    return `${count} component${count !== 1 ? 's' : ''} rendered`;
  }
  
  /**
   * Scroll the chat container to the bottom
   */
  private scrollChatToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Error scrolling chat to bottom:', err);
    }
  }
  
  /**
   * Show an error message to the user
   * @param message - Error message to display
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
  
  /**
   * Extract error message from error object
   * @param error - Error object
   * @returns Error message string
   */
  private getErrorMessage(error: any): string {
    return error.message || error.error?.message || 'Unknown error occurred';
  }
}