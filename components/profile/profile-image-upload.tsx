"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, Upload, X } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { clientLogger } from "@/lib/client-logger"

interface ProfileImageUploadProps {
  onImageChange?: (imageUrl: string) => void
  className?: string
}

export function ProfileImageUpload({ onImageChange, className }: ProfileImageUploadProps) {
  const { user } = useAuth()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB')
      return
    }

    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    onImageChange?.(url)
  }

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) return

    setIsUploading(true)
    try {
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In a real app, you would upload to your server here
      clientLogger.info('Image uploaded successfully')
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      clientLogger.error('Upload failed', {}, error instanceof Error ? error : undefined)
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onImageChange?.('')
  }

  const currentImageUrl = previewUrl || user?.image || ''

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          {/* Avatar Display */}
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={currentImageUrl} alt={user?.name || "Profile"} />
              <AvatarFallback className="text-2xl">
                {user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            
            {/* Upload Overlay */}
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Camera className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose Image
            </Button>
            
            {previewUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={isUploading}
              >
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            )}
          </div>

          {/* Upload Button */}
          {previewUrl && (
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? "Uploading..." : "Upload Image"}
            </Button>
          )}

          {/* Help Text */}
          <div className="text-center text-sm text-gray-500">
            <p>JPG, PNG or GIF</p>
            <p>Maximum file size: 2MB</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}



