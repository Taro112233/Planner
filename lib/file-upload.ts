// lib/file-upload.ts
// NextJS Starter - File Upload Utilities (Vercel Blob)
// ============================================

import { 
  validateFile, 
  sanitizeFilename, 
  formatFileSize as formatSize,
  type FileValidationErrorCode,
} from './file-validation';

// ===== CONSTANTS =====

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES_PER_REQUEST = 5;
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];

// ===== ERROR CLASS =====

/**
 * Custom error class for file validation errors
 */
export class FileUploadError extends Error {
  public readonly code?: FileValidationErrorCode;
  public readonly filename?: string;

  constructor(message: string, code?: FileValidationErrorCode, filename?: string) {
    super(message);
    this.name = 'FileUploadError';
    this.code = code;
    this.filename = filename;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FileUploadError);
    }
  }
}

// ===== INTERFACES =====

export interface UploadedFile {
  filename: string;
  originalFilename: string;
  fileType: string;
  fileSize: number;
  fileSizeFormatted: string;
  fileUrl: string;
}

export interface UploadResult {
  success: boolean;
  files?: UploadedFile[];
  errors?: string[];
  totalUploaded?: number;
  totalFailed?: number;
}

// ===== UPLOAD FUNCTIONS =====

/**
 * Upload a single file to Vercel Blob
 */
export async function uploadFile(
  file: File, 
  userId?: string,
  requestId?: string
): Promise<UploadedFile> {
  // Validate file
  const validation = validateFile(file);
  if (!validation.isValid) {
    throw new FileUploadError(
      validation.error || 'Invalid file',
      validation.code,
      file.name
    );
  }
  
  // Sanitize filename
  const safeFilename = sanitizeFilename(file.name);
  
  // Generate unique path
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  let uniquePath: string;
  if (requestId) {
    uniquePath = `requests/${requestId}/${timestamp}-${random}-${safeFilename}`;
  } else if (userId) {
    uniquePath = `uploads/${userId}/${timestamp}-${random}-${safeFilename}`;
  } else {
    uniquePath = `uploads/${timestamp}-${random}-${safeFilename}`;
  }
  
  try {
    // Dynamic import for Vercel Blob (only available server-side)
    const { put } = await import('@vercel/blob');
    
    const blob = await put(uniquePath, file, {
      access: 'public',
      addRandomSuffix: false,
    });
    
    return {
      filename: safeFilename,
      originalFilename: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileSizeFormatted: formatSize(file.size),
      fileUrl: blob.url,
    };
  } catch (error) {
    console.error('File upload error:', error);
    throw new FileUploadError(
      `Failed to upload file: ${safeFilename}`,
      undefined,
      file.name
    );
  }
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(
  files: File[],
  userId?: string,
  requestId?: string
): Promise<UploadResult> {
  // Validate file count
  if (files.length > MAX_FILES_PER_REQUEST) {
    return {
      success: false,
      errors: [`อัปโหลดได้สูงสุด ${MAX_FILES_PER_REQUEST} ไฟล์`],
      totalUploaded: 0,
      totalFailed: files.length,
    };
  }
  
  if (files.length === 0) {
    return {
      success: false,
      errors: ['ไม่มีไฟล์ที่จะอัปโหลด'],
      totalUploaded: 0,
      totalFailed: 0,
    };
  }
  
  const uploadedFiles: UploadedFile[] = [];
  const errors: string[] = [];
  
  // Upload files concurrently
  const results = await Promise.allSettled(
    files.map(file => uploadFile(file, userId, requestId))
  );
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      uploadedFiles.push(result.value);
    } else {
      const errorMessage = result.reason instanceof FileUploadError
        ? result.reason.message
        : result.reason?.message || 'Unknown error';
      errors.push(`${files[index].name}: ${errorMessage}`);
    }
  });
  
  return {
    success: errors.length === 0,
    files: uploadedFiles.length > 0 ? uploadedFiles : undefined,
    errors: errors.length > 0 ? errors : undefined,
    totalUploaded: uploadedFiles.length,
    totalFailed: errors.length,
  };
}

/**
 * Delete a file from Vercel Blob
 */
export async function deleteFile(fileUrl: string): Promise<boolean> {
  try {
    const { del } = await import('@vercel/blob');
    await del(fileUrl);
    return true;
  } catch (error) {
    console.error('File delete error:', error);
    return false;
  }
}

/**
 * Delete multiple files
 */
export async function deleteMultipleFiles(fileUrls: string[]): Promise<{
  success: boolean;
  deleted: number;
  failed: number;
}> {
  if (fileUrls.length === 0) {
    return { success: true, deleted: 0, failed: 0 };
  }
  
  let deleted = 0;
  let failed = 0;
  
  await Promise.all(
    fileUrls.map(async (url) => {
      const result = await deleteFile(url);
      if (result) {
        deleted++;
      } else {
        failed++;
      }
    })
  );
  
  return {
    success: failed === 0,
    deleted,
    failed,
  };
}

// ===== FORM DATA HELPERS =====

/**
 * Extract files from FormData
 */
export function extractFilesFromFormData(
  formData: FormData, 
  fieldName: string = 'files'
): File[] {
  const files: File[] = [];
  const entries = formData.getAll(fieldName);
  
  for (const entry of entries) {
    if (entry instanceof File && entry.size > 0) {
      files.push(entry);
    }
  }
  
  return files;
}

/**
 * Validate all files in FormData
 */
export function validateFilesInFormData(
  formData: FormData,
  fieldName: string = 'files'
): { isValid: boolean; files: File[]; errors: string[] } {
  const files = extractFilesFromFormData(formData, fieldName);
  const errors: string[] = [];
  
  if (files.length > MAX_FILES_PER_REQUEST) {
    errors.push(`อัปโหลดได้สูงสุด ${MAX_FILES_PER_REQUEST} ไฟล์`);
  }
  
  files.forEach((file, index) => {
    const validation = validateFile(file);
    if (!validation.isValid) {
      errors.push(`ไฟล์ ${index + 1} (${file.name}): ${validation.error}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    files,
    errors,
  };
}

// ===== URL HELPERS =====

/**
 * Get file extension from URL or filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Check if file is an image
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Check if file is a PDF
 */
export function isPdfFile(mimeType: string): boolean {
  return mimeType === 'application/pdf';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  return formatSize(bytes);
}

/**
 * Get thumbnail URL for file (if image) or icon type
 */
export function getFileThumbnail(file: UploadedFile): {
  type: 'image' | 'pdf' | 'unknown';
  url?: string;
} {
  if (isImageFile(file.fileType)) {
    return { type: 'image', url: file.fileUrl };
  }
  if (isPdfFile(file.fileType)) {
    return { type: 'pdf' };
  }
  return { type: 'unknown' };
}