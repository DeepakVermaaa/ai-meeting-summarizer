import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { FileUploadRequest, FileUploadResponse } from '../models/api.models';

/**
 * File Upload Service
 * Handles PDF file uploads to the backend API
 */
@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  constructor() {}

  /**
   * Upload a PDF file to the backend
   * @param file - The PDF file to upload
   * @returns Observable with upload response
   */
  uploadFile(file: File): Observable<FileUploadResponse> {
    // In a real implementation, this would use HttpClient to post the file
    // For now, we're simulating the API response
    
    console.log('Uploading file:', file.name, file.size);
    
    // Create a mock response
    const response: FileUploadResponse = {
      success: true,
      session_id: 'session_' + Math.random().toString(36).substr(2, 9),
      document_id: 'doc_' + Math.random().toString(36).substr(2, 9),
      file_name: file.name,
      file_size: file.size,
      upload_timestamp: new Date().toISOString(),
      processing_status: 'processing',
      estimated_processing_time: 5,
      message: 'File uploaded successfully and queued for processing'
    };
    
    // Simulate network delay
    return of(response).pipe(delay(1500));
  }
  
  /**
   * Get upload progress
   * In a real implementation, this would track actual upload progress
   * @param uploadId - ID of the upload to track
   * @returns Observable with progress percentage
   */
  getUploadProgress(uploadId: string): Observable<number> {
    // Mock progress reporting
    return of(100).pipe(delay(1000));
  }
}