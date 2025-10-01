'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, X, File, Image, Video, FileText, Music } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { logger } from '@/lib/logger'

interface FileUploadProps {
  onUploadComplete?: (results: UploadResult[]) => void
  onUploadError?: (error: string) => void
  purpose: 'product' | 'category' | 'user' | 'review' | 'temp'
  category?: 'image' | 'video' | 'document' | 'audio' | 'other'
  maxFiles?: number
  maxSize?: number
  allowedTypes?: string[]
  generateSizes?: boolean
  createThumbnail?: boolean
  multiple?: boolean
  className?: string
}

interface UploadResult {
  success: boolean
  url?: string
  filename?: string
  size?: number
  mimeType?: string
  error?: string
}

interface UploadingFile {
  file: File
  progress: number
  status: 'uploading' | 'completed' | 'error'
  result?: UploadResult
}

export function FileUpload({
  onUploadComplete,
  onUploadError,
  purpose,
  category = 'other',
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  allowedTypes = [],
  generateSizes = false,
  createThumbnail = false,
  multiple = true,
  className = '',
}: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get file icon based on type
  const getFileIcon = (file: File) => {
    const type = file.type.toLowerCase()
    if (type.startsWith('image/')) return <Image className="h-5 w-5" />
    if (type.startsWith('video/')) return <Video className="h-5 w-5" />
    if (type.startsWith('audio/')) return <Music className="h-5 w-5" />
    if (type.includes('pdf') || type.includes('document') || type.includes('text')) {
      return <FileText className="h-5 w-5" />
    }
    return <File className="h-5 w-5" />
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Validate file
  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File size exceeds maximum of ${formatFileSize(maxSize)}`
    }

    // Check file type
    if (allowedTypes.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      if (!fileExtension || !allowedTypes.includes(fileExtension)) {
        return `File type .${fileExtension} is not allowed`
      }
    }

    return null
  }

  // Handle file selection
  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return

    const fileArray = Array.from(files)
    const validFiles: File[] = []
    const errors: string[] = []

    // Validate files
    for (const file of fileArray) {
      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)
      }
    }

    // Show validation errors
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error))
    }

    // Check file count limit
    if (validFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`)
      return
    }

    if (validFiles.length > 0) {
      uploadFiles(validFiles)
    }
  }, [maxFiles, maxSize, allowedTypes])

  // Upload files
  const uploadFiles = async (files: File[]) => {
    setIsUploading(true)

    // Initialize uploading files state
    const initialUploadingFiles: UploadingFile[] = files.map(file => ({
      file,
      progress: 0,
      status: 'uploading',
    }))
    setUploadingFiles(initialUploadingFiles)

    try {
      const formData = new FormData()
      files.forEach(file => formData.append('files', file))
      formData.append('purpose', purpose)
      formData.append('category', category)
      if (generateSizes) formData.append('generateSizes', 'true')
      if (createThumbnail) formData.append('createThumbnail', 'true')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Upload failed')
      }

      // Update uploading files with results
      const updatedFiles = initialUploadingFiles.map((uploadingFile, index) => ({
        ...uploadingFile,
        progress: 100,
        status: (data.data.uploads[index].success ? 'completed' : 'error') as 'uploading' | 'completed' | 'error',
        result: data.data.uploads[index],
      }))

      setUploadingFiles(updatedFiles)

      // Check for failed uploads
      const failedUploads = data.data.uploads.filter((result: UploadResult) => !result.success)
      if (failedUploads.length > 0) {
        failedUploads.forEach((result: UploadResult) => {
          toast.error(`Upload failed: ${result.error}`)
        })
      }

      // Show success message
      const successfulUploads = data.data.uploads.filter((result: UploadResult) => result.success)
      if (successfulUploads.length > 0) {
        toast.success(`${successfulUploads.length} file(s) uploaded successfully`)
        onUploadComplete?.(successfulUploads)
      }

    } catch (error) {
      logger.error('File upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      toast.error(errorMessage)
      onUploadError?.(errorMessage)

      // Update all files to error state
      setUploadingFiles(prev => prev.map(file => ({
        ...file,
        status: 'error',
        result: { success: false, error: errorMessage },
      })))
    } finally {
      setIsUploading(false)
    }
  }

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  // Remove uploading file
  const removeUploadingFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Clear all files
  const clearAllFiles = () => {
    setUploadingFiles([])
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload Files</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Maximum {maxFiles} files, up to {formatFileSize(maxSize)} each
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              variant="outline"
            >
              Choose Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple={multiple}
              accept={allowedTypes.map(type => `.${type}`).join(',')}
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Uploading Files</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFiles}
                disabled={isUploading}
              >
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadingFiles.map((uploadingFile, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 p-3 border rounded-lg"
                >
                  {getFileIcon(uploadingFile.file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {uploadingFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(uploadingFile.file.size)}
                    </p>
                    {uploadingFile.status === 'uploading' && (
                      <Progress value={uploadingFile.progress} className="mt-2" />
                    )}
                    {uploadingFile.status === 'completed' && (
                      <p className="text-xs text-green-600 mt-1">Upload completed</p>
                    )}
                    {uploadingFile.status === 'error' && (
                      <p className="text-xs text-red-600 mt-1">
                        Error: {uploadingFile.result?.error}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUploadingFile(index)}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {uploadingFiles.some(file => file.status === 'error') && (
        <Alert variant="destructive">
          <AlertDescription>
            Some files failed to upload. Please check the errors above and try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

