'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { clientLogger } from '@/lib/client-logger'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Upload, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share,
  Plus,
  Filter,
  Search
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Reel {
  id: string
  title: string
  description?: string
  videoUrl: string
  thumbnailUrl?: string
  duration?: number
  fileSize?: number
  status: 'PROCESSING' | 'PUBLISHED' | 'ARCHIVED' | 'DELETED'
  featured: boolean
  trendingScore: number
  viewCount: number
  likeCount: number
  commentCount: number
  shareCount: number
  createdAt: string
  publishedAt?: string
  admin: {
    id: string
    name: string
    email: string
  }
  products: Array<{
    id: string
    product: {
      id: string
      name: string
      price: number
      images: string[]
    }
    positionX: number
    positionY: number
  }>
  hashtags: Array<{
    id: string
    hashtag: string
  }>
  _count: {
    interactions: number
    comments: number
  }
}

export default function AdminReelsPage() {
  const [reels, setReels] = useState<Reel[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    video: null as File | null,
    productIds: '',
    hashtags: ''
  })

  // Load reels
  const loadReels = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/reels')
      const data = await response.json()
      
      if (data.success) {
        setReels(data.data || [])
      }
    } catch (error) {
      clientLogger.error('Failed to load reels', {}, error instanceof Error ? error : undefined)
    } finally {
      setLoading(false)
    }
  }

  // Handle file upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadForm(prev => ({ ...prev, video: file }))
    }
  }

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!uploadForm.title || !uploadForm.video) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setUploading(true)
      
      const formData = new FormData()
      formData.append('title', uploadForm.title)
      formData.append('description', uploadForm.description)
      formData.append('video', uploadForm.video)
      formData.append('productIds', uploadForm.productIds)
      formData.append('hashtags', uploadForm.hashtags)
      // Get admin ID from session/auth - for now we'll handle it on the server side

      const response = await fetch('/api/admin/reels', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Reel uploaded successfully!')
        setIsUploadDialogOpen(false)
        setUploadForm({
          title: '',
          description: '',
          video: null,
          productIds: '',
          hashtags: ''
        })
        loadReels()
      } else {
        alert(`Upload failed: ${data.error}`)
      }
    } catch (error) {
      clientLogger.error('Upload failed', {}, error instanceof Error ? error : undefined)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  // Handle reel actions
  const handleToggleFeatured = async (reelId: string, featured: boolean) => {
    try {
      const response = await fetch(`/api/admin/reels/${reelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !featured })
      })

      if (response.ok) {
        setReels(prev => prev.map(reel => 
          reel.id === reelId ? { ...reel, featured: !featured } : reel
        ))
      }
    } catch (error) {
      clientLogger.error('Failed to toggle featured', {}, error instanceof Error ? error : undefined)
    }
  }

  const handleDeleteReel = async (reelId: string) => {
    if (!confirm('Are you sure you want to delete this reel?')) return

    try {
      const response = await fetch(`/api/admin/reels/${reelId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setReels(prev => prev.filter(reel => reel.id !== reelId))
      }
    } catch (error) {
      clientLogger.error('Failed to delete reel', {}, error instanceof Error ? error : undefined)
    }
  }

  // Filter reels
  const filteredReels = reels.filter(reel => {
    const matchesSearch = reel.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reel.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || reel.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Load reels on mount
  useEffect(() => {
    loadReels()
  }, [])

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Reels Management</h1>
          <p className="text-muted-foreground">Manage your video content and track performance</p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Upload Reel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload New Reel</DialogTitle>
              <DialogDescription>
                Upload a video to create a new reel for your audience
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter reel title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter reel description"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="video">Video File *</Label>
                <Input
                  id="video"
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Supported formats: MP4, MOV, AVI, WebM (Max 100MB)
                </p>
              </div>
              <div>
                <Label htmlFor="productIds">Product IDs (comma-separated)</Label>
                <Input
                  id="productIds"
                  value={uploadForm.productIds}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, productIds: e.target.value }))}
                  placeholder="product1, product2, product3"
                />
              </div>
              <div>
                <Label htmlFor="hashtags">Hashtags (comma-separated)</Label>
                <Input
                  id="hashtags"
                  value={uploadForm.hashtags}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, hashtags: e.target.value }))}
                  placeholder="#fashion, #style, #trending"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUploadDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload Reel'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search reels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">All Status</option>
          <option value="PROCESSING">Processing</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
          <option value="DELETED">Deleted</option>
        </select>
      </div>

      {/* Reels Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reels ({filteredReels.length})</CardTitle>
          <CardDescription>
            Manage your video content and track engagement metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thumbnail</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>File Size</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Likes</TableHead>
                  <TableHead>Comments</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReels.map((reel) => (
                  <TableRow key={reel.id}>
                    <TableCell>
                      {reel.thumbnailUrl ? (
                        <img
                          src={reel.thumbnailUrl}
                          alt={reel.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                          <Play className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{reel.title}</div>
                        {reel.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {reel.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        reel.status === 'PUBLISHED' ? 'default' :
                        reel.status === 'PROCESSING' ? 'secondary' :
                        reel.status === 'ARCHIVED' ? 'outline' : 'destructive'
                      }>
                        {reel.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDuration(reel.duration)}</TableCell>
                    <TableCell>{formatFileSize(reel.fileSize)}</TableCell>
                    <TableCell>{reel.viewCount.toLocaleString()}</TableCell>
                    <TableCell>{reel.likeCount.toLocaleString()}</TableCell>
                    <TableCell>{reel.commentCount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleFeatured(reel.id, reel.featured)}
                      >
                        {reel.featured ? '⭐' : '☆'}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteReel(reel.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


