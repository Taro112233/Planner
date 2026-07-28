// lib/file-validation.ts
// NextJS Starter - File Validation Utilities
// ============================================

// ===== CONSTANTS =====
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
export const MAX_FILES_PER_REQUEST = 5;

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
] as const;

export const ALLOWED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.pdf',
] as const;

export type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number];

// ===== INTERFACES =====
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  code?: FileValidationErrorCode;
}

export interface FilesValidationResult {
  isValid: boolean;
  files: File[];
  errors: string[];
}

export interface FileInfo {
  filename: string;
  sanitizedFilename: string;
  extension: string;
  mimeType: string;
  size: number;
  sizeFormatted: string;
}

export type FileValidationErrorCode = 
  | 'SIZE_EXCEEDED' 
  | 'INVALID_TYPE' 
  | 'INVALID_EXTENSION' 
  | 'EMPTY_FILE' 
  | 'MIME_MISMATCH';

export interface FileValidationError {
  filename: string;
  error: string;
  code?: FileValidationErrorCode;
}

// ===== HELPER FUNCTIONS =====

/**
 * Format file size to human readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.slice(lastDot).toLowerCase();
}

/**
 * Check if MIME type is allowed
 */
export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType);
}

/**
 * Check if file extension is allowed
 */
export function isAllowedExtension(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number]);
}

/**
 * Sanitize filename - remove dangerous characters
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and null bytes
  let sanitized = filename
    .replace(/[/\\]/g, '_')
    .replace(/\0/g, '');
  
  // Replace spaces and special chars with underscore
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Remove multiple consecutive underscores
  sanitized = sanitized.replace(/_+/g, '_');
  
  // Remove leading/trailing underscores
  sanitized = sanitized.replace(/^_+|_+$/g, '');
  
  // Ensure filename is not empty
  if (!sanitized || sanitized === '') {
    sanitized = 'unnamed_file';
  }
  
  // Limit filename length (preserve extension)
  const ext = getFileExtension(sanitized);
  const nameWithoutExt = sanitized.slice(0, sanitized.length - ext.length);
  
  if (nameWithoutExt.length > 100) {
    sanitized = nameWithoutExt.slice(0, 100) + ext;
  }
  
  return sanitized;
}

/**
 * Get file info from File object
 */
export function getFileInfo(file: File): FileInfo {
  return {
    filename: file.name,
    sanitizedFilename: sanitizeFilename(file.name),
    extension: getFileExtension(file.name),
    mimeType: file.type,
    size: file.size,
    sizeFormatted: formatFileSize(file.size),
  };
}

// ===== VALIDATION FUNCTIONS =====

/**
 * Validate a single file
 */
export function validateFile(file: File): FileValidationResult {
  // Check if file exists and has content
  if (!file || file.size === 0) {
    return {
      isValid: false,
      error: 'ไฟล์ว่างเปล่าหรือไม่มีข้อมูล',
      code: 'EMPTY_FILE',
    };
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `ไฟล์มีขนาดใหญ่เกินไป (สูงสุด ${formatFileSize(MAX_FILE_SIZE)}) - ไฟล์นี้มีขนาด ${formatFileSize(file.size)}`,
      code: 'SIZE_EXCEEDED',
    };
  }
  
  // Check MIME type
  if (!isAllowedMimeType(file.type)) {
    return {
      isValid: false,
      error: `ประเภทไฟล์ไม่รองรับ (${file.type || 'unknown'}) - รองรับเฉพาะ: รูปภาพ (JPEG, PNG, GIF, WebP) และ PDF`,
      code: 'INVALID_TYPE',
    };
  }
  
  // Check file extension
  if (!isAllowedExtension(file.name)) {
    return {
      isValid: false,
      error: `นามสกุลไฟล์ไม่รองรับ (${getFileExtension(file.name) || 'ไม่มี'}) - รองรับเฉพาะ: ${ALLOWED_EXTENSIONS.join(', ')}`,
      code: 'INVALID_EXTENSION',
    };
  }
  
  // Additional check: MIME type should match extension
  const ext = getFileExtension(file.name);
  const mimeExtMap: Record<string, string[]> = {
    '.jpg': ['image/jpeg'],
    '.jpeg': ['image/jpeg'],
    '.png': ['image/png'],
    '.gif': ['image/gif'],
    '.webp': ['image/webp'],
    '.pdf': ['application/pdf'],
  };
  
  const expectedMimes = mimeExtMap[ext];
  if (expectedMimes && !expectedMimes.includes(file.type)) {
    return {
      isValid: false,
      error: `นามสกุลไฟล์ไม่ตรงกับประเภทไฟล์ (${ext} ควรเป็น ${expectedMimes.join(' หรือ ')} แต่ได้รับ ${file.type})`,
      code: 'MIME_MISMATCH',
    };
  }
  
  return { isValid: true };
}

/**
 * Validate multiple files
 */
export function validateFiles(files: File[]): FilesValidationResult {
  const errors: string[] = [];
  const validFiles: File[] = [];
  
  // Check total count
  if (files.length > MAX_FILES_PER_REQUEST) {
    errors.push(`อัปโหลดได้สูงสุด ${MAX_FILES_PER_REQUEST} ไฟล์ (พยายามอัปโหลด ${files.length} ไฟล์)`);
  }
  
  // Validate each file (limit to max allowed)
  const filesToValidate = files.slice(0, MAX_FILES_PER_REQUEST);
  
  filesToValidate.forEach((file, index) => {
    const result = validateFile(file);
    if (result.isValid) {
      validFiles.push(file);
    } else {
      errors.push(`ไฟล์ ${index + 1} (${file.name}): ${result.error}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    files: validFiles,
    errors,
  };
}

/**
 * Extract and validate files from FormData
 */
export function validateFilesFromFormData(
  formData: FormData,
  fieldName: string = 'files'
): FilesValidationResult {
  const files: File[] = [];
  
  // Extract files from FormData
  const entries = formData.getAll(fieldName);
  
  for (const entry of entries) {
    if (entry instanceof File && entry.size > 0) {
      files.push(entry);
    }
  }
  
  // No files found
  if (files.length === 0) {
    return {
      isValid: true, // Empty is valid (files are optional)
      files: [],
      errors: [],
    };
  }
  
  // Validate extracted files
  return validateFiles(files);
}

/**
 * Check if total upload size is within limit
 */
export function validateTotalSize(files: File[], maxTotalSize?: number): FileValidationResult {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const limit = maxTotalSize || MAX_FILE_SIZE * MAX_FILES_PER_REQUEST;
  
  if (totalSize > limit) {
    return {
      isValid: false,
      error: `ขนาดไฟล์รวมเกินกำหนด (${formatFileSize(totalSize)} / ${formatFileSize(limit)})`,
      code: 'SIZE_EXCEEDED',
    };
  }
  
  return { isValid: true };
}

// ===== CLIENT-SIDE HELPERS =====

/**
 * Create file input accept attribute string
 */
export function getAcceptAttribute(): string {
  return ALLOWED_MIME_TYPES.join(',');
}

/**
 * Get human-readable allowed types string
 */
export function getAllowedTypesDescription(): string {
  return 'รูปภาพ (JPEG, PNG, GIF, WebP) และ PDF';
}

/**
 * Get upload constraints for UI display
 */
export function getUploadConstraints() {
  return {
    maxFileSize: MAX_FILE_SIZE,
    maxFileSizeFormatted: formatFileSize(MAX_FILE_SIZE),
    maxFiles: MAX_FILES_PER_REQUEST,
    allowedTypes: ALLOWED_MIME_TYPES,
    allowedExtensions: ALLOWED_EXTENSIONS,
    allowedTypesDescription: getAllowedTypesDescription(),
    acceptAttribute: getAcceptAttribute(),
  };
}