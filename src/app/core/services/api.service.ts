import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { 
  ProcessDocumentRequest, 
  ProcessDocumentResponse, 
  ChatRequest, 
  ChatResponse,
  APIResponse,
  API_CONFIG
} from '../models/api.models';
import { AGUIMessage, AGUISuggestion } from '../models/agui.models';

// Import mock data for testing
import { MOCK_AGUI_MESSAGE } from './mock-data';

/**
 * API Service
 * Handles all HTTP communication with the backend API
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = API_CONFIG.BASE_URL;
  
  // Flag to enable mock mode (no real backend)
  private useMockData = true;

  constructor(private http: HttpClient) {}

  /**
   * Process an uploaded document
   * @param request - Document processing request
   * @returns Observable with processing response
   */
  processDocument(request: ProcessDocumentRequest): Observable<ProcessDocumentResponse> {
    if (this.useMockData) {
      return this.getMockProcessResponse(request);
    }
    
    // In a real implementation:
    // return this.http.post<APIResponse<ProcessDocumentResponse>>(
    //   `${this.baseUrl}${API_CONFIG.ENDPOINTS.PROCESS}`,
    //   request
    // ).pipe(map(response => response.data));
    
    return of() as Observable<ProcessDocumentResponse>; // Placeholder with correct type
  }

  /**
   * Send a chat request for follow-up questions
   * @param request - Chat request
   * @returns Observable with chat response
   */
  sendChatRequest(request: ChatRequest): Observable<ChatResponse> {
    if (this.useMockData) {
      return this.getMockChatResponse(request);
    }
    
    // In a real implementation:
    // return this.http.post<APIResponse<ChatResponse>>(
    //   `${this.baseUrl}${API_CONFIG.ENDPOINTS.CHAT}`,
    //   request
    // ).pipe(map(response => response.data));
    
    return of() as Observable<ChatResponse>; // Placeholder with correct type
  }

  /**
   * Get session information
   * @param sessionId - ID of the session to retrieve
   * @returns Observable with session context
   */
  getSessionInfo(sessionId: string): Observable<any> {
    if (this.useMockData) {
      return of({
        session_id: sessionId,
        created_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        status: 'active'
      }).pipe(delay(500));
    }
    
    // In a real implementation:
    // return this.http.get<APIResponse<any>>(
    //   `${this.baseUrl}${API_CONFIG.ENDPOINTS.SESSION}/${sessionId}`
    // ).pipe(map(response => response.data));
    
    return of(); // Placeholder
  }

  /**
   * Generate a mock process document response
   * @param request - Processing request
   * @returns Observable with mock response
   */
  private getMockProcessResponse(request: ProcessDocumentRequest): Observable<ProcessDocumentResponse> {
    console.log('Mock processing document:', request);
    
    // Create a mock response using the test data
    const response: ProcessDocumentResponse = {
      success: true,
      session_id: request.session_id,
      document_id: request.document_id,
      processing_time: 3.2,
      agui_response: MOCK_AGUI_MESSAGE as AGUIMessage
    };
    
    // Simulate network and processing delay
    return of(response).pipe(delay(3000));
  }

  /**
   * Generate a mock chat response
   * @param request - Chat request
   * @returns Observable with mock response
   */
  private getMockChatResponse(request: ChatRequest): Observable<ChatResponse> {
    console.log('Mock chat request:', request);
    
    // Extract the question for smarter mock responses
    const question = request.question.toLowerCase();
    
    // Prepare a response based on the question
    let responseText = '';
    let responseType: 'text_response' | 'agui_update' | 'filter_applied' = 'text_response';
    
    if (question.includes('budget') || question.includes('financial')) {
      responseText = 'The Q1 budget allocation is 40% to product development, 30% to marketing, 20% to operations, and 10% to contingency. The marketing budget was increased by 15% compared to last quarter.';
    } else if (question.includes('action') || question.includes('task')) {
      responseText = 'There are 5 action items from the meeting:\n1. Finalize Q1 budget spreadsheet (Sarah Chen)\n2. Schedule team restructuring meetings (Michael Johnson)\n3. Prepare product launch timeline (David Rodriguez)\n4. Update marketing strategy document (Jessica Kim)\n5. Revise Q1 sales targets (Alex Thompson)';
    } else if (question.includes('risk') || question.includes('issue')) {
      responseText = 'The meeting identified three key risks:\n1. Potential budget overrun in Q2 (High severity)\n2. Integration testing environment down (Critical severity)\n3. Client feedback pending for UI designs (Medium severity)';
    } else if (question.includes('summary')) {
      responseText = 'The Q1 planning meeting covered budget allocation, team restructuring, and upcoming product launches. The team approved a budget with 40% allocated to product development. Team restructuring will begin February 1st, and three new product launches are scheduled for Q1.';
    } else {
      responseText = 'The meeting discussed several topics including budget allocation, team restructuring, and product launches. Is there a specific aspect you would like more information about?';
    }
    
    // Create suggestions for follow-up questions
    const suggestions = [
      { type: 'follow_up_question' as const, text: 'What are the key action items from the meeting?' },
      { type: 'follow_up_question' as const, text: 'Tell me more about the team restructuring plan' },
      { type: 'follow_up_question' as const, text: 'What risks were identified during the meeting?' },
      { type: 'follow_up_question' as const, text: 'When are the product launches scheduled?' }
    ];
    
    // Create the mock response
    const response: ChatResponse = {
      success: true,
      session_id: request.session_id,
      response_type: responseType as 'text_response',
      text_response: responseText,
      suggestions: suggestions,
      processing_time: 1.5
    };
    
    // Simulate network delay
    return of(response).pipe(delay(1500));
  }
}