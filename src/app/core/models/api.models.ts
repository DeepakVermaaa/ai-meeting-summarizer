// API request and response models for backend communication

import { AGUIMessage, AGUISuggestion, ComponentType } from "./agui.models";

/**
 * Request payload for uploading PDF files to backend
 * Used when user uploads a meeting document
 */
export interface FileUploadRequest {
  file: File; // The PDF file to upload
  session_id?: string; // Optional session ID to maintain context
  options?: {
    extract_text: boolean; // Whether to extract text from PDF
    analyze_content: boolean; // Whether to perform AI analysis
    meeting_type_hint?: string; // Hint about meeting type for better processing
  };
}

/**
 * Response from file upload endpoint
 * Returns session info and processing status
 */
export interface FileUploadResponse {
  success: boolean; // Whether upload was successful
  session_id: string; // Session ID for this upload
  document_id: string; // Unique identifier for uploaded document
  file_name: string; // Original filename
  file_size: number; // File size in bytes
  upload_timestamp: string; // When file was uploaded
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'; // Current status
  estimated_processing_time?: number; // Estimated time in seconds
  message?: string; // Success or error message
}

/**
 * Request for AI processing of uploaded document
 * Sent after successful file upload to trigger AI analysis
 */
export interface ProcessDocumentRequest {
  session_id: string; // Session ID from file upload
  document_id: string; // Document ID from file upload
  processing_options?: {
    focus_areas?: string[]; // Specific areas to focus on (e.g., "action_items", "risks")
    output_format: 'agui' | 'json' | 'text'; // Desired output format
    component_preferences?: ComponentType[]; // Preferred component types
    detail_level: 'summary' | 'detailed' | 'comprehensive'; // Level of detail
  };
}

/**
 * Response from document processing endpoint
 * Contains the AG-UI formatted response with components
 */
export interface ProcessDocumentResponse {
  success: boolean; // Whether processing was successful
  session_id: string; // Session ID
  document_id: string; // Document ID
  processing_time: number; // Time taken to process in seconds
  agui_response: AGUIMessage; // Main AG-UI formatted response
  raw_text?: string; // Optional extracted text for debugging
  error?: APIError; // Error information if processing failed
}

/**
 * Request for follow-up chat questions
 * Used when user asks questions after initial document processing
 */
export interface ChatRequest {
  session_id: string; // Session ID to maintain context
  question: string; // User's question
  question_type?: 'filter' | 'analysis' | 'clarification'; // Type of question
  context?: {
    current_components: string[]; // IDs of currently displayed components
    previous_filters?: any; // Any filters currently applied
    conversation_history?: ChatMessage[]; // Previous chat messages
  };
}

/**
 * Response from chat endpoint
 * Can return new components, filtered data, or text responses
 */
export interface ChatResponse {
  success: boolean; // Whether request was successful
  session_id: string; // Session ID
  response_type: 'agui_update' | 'text_response' | 'filter_applied'; // Type of response
  agui_response?: AGUIMessage; // New AG-UI components (if applicable)
  text_response?: string; // Text answer (if applicable)
  filter_info?: FilterInfo; // Information about applied filters
  suggestions?: AGUISuggestion[]; // Follow-up suggestions
  processing_time: number; // Response time in seconds
  error?: APIError; // Error information if request failed
}

/**
 * Information about applied filters
 * Used when chat response applies filters to existing data
 */
export interface FilterInfo {
  filter_type: 'client_side' | 'server_side'; // Where filter was applied
  criteria: { // Filter criteria applied
    [key: string]: any;
  };
  affected_components: string[]; // IDs of components that were filtered
  results_count: number; // Number of items after filtering
}

/**
 * Individual chat message for conversation history
 */
export interface ChatMessage {
  id: string; // Unique message ID
  type: 'user' | 'assistant' | 'system'; // Who sent the message
  content: string; // Message content
  timestamp: string; // When message was sent
  metadata?: {
    session_id: string; // Session this message belongs to
    triggered_action?: string; // Action triggered by this message
    response_time?: number; // Time taken to generate response
  };
}

/**
 * Session information and context
 * Maintains state across multiple requests
 */
export interface SessionContext {
  session_id: string; // Unique session identifier
  document_id?: string; // Associated document ID
  user_id?: string; // User identifier (if authentication enabled)
  created_at: string; // When session was created
  last_activity: string; // Last activity timestamp
  status: 'active' | 'inactive' | 'expired'; // Session status
  metadata: {
    original_filename?: string; // Original PDF filename
    document_type?: string; // Detected document type
    processing_history: ProcessingHistoryItem[]; // History of processing requests
  };
}

/**
 * Individual processing history item
 */
export interface ProcessingHistoryItem {
  timestamp: string; // When processing occurred
  type: 'upload' | 'initial_processing' | 'chat_request'; // Type of processing
  duration: number; // Processing time in seconds
  success: boolean; // Whether processing was successful
  components_generated?: number; // Number of components generated
  error?: string; // Error message if failed
}

/**
 * Standard API error structure
 * Used across all endpoints for consistent error handling
 */
export interface APIError {
  code: string; // Error code (e.g., "INVALID_FILE", "PROCESSING_FAILED")
  message: string; // Human-readable error message
  details?: any; // Additional error details
  timestamp: string; // When error occurred
  request_id?: string; // Request ID for debugging
  suggestions?: string[]; // Suggested actions to resolve error
}

/**
 * API configuration and constants
 */
export const API_CONFIG = {
  BASE_URL: '/api/v1', // Base API URL
  ENDPOINTS: {
    UPLOAD: '/upload', // File upload endpoint
    PROCESS: '/process', // Document processing endpoint
    CHAT: '/chat', // Chat/questions endpoint
    SESSION: '/session', // Session management endpoint
    HEALTH: '/health' // Health check endpoint
  },
  TIMEOUTS: {
    UPLOAD: 60000, // Upload timeout (60 seconds)
    PROCESSING: 120000, // Processing timeout (2 minutes)
    CHAT: 30000 // Chat timeout (30 seconds)
  },
  FILE_LIMITS: {
    MAX_SIZE: 10 * 1024 * 1024, // Max file size (10MB)
    ALLOWED_TYPES: ['application/pdf'], // Allowed MIME types
    ALLOWED_EXTENSIONS: ['.pdf'] // Allowed file extensions
  }
} as const;

/**
 * HTTP response wrapper for all API calls
 * Provides consistent structure for handling responses
 */
export interface APIResponse<T = any> {
  data: T; // Response data
  status: number; // HTTP status code
  message?: string; // Optional message
  timestamp: string; // Response timestamp
  request_id: string; // Request tracking ID
}