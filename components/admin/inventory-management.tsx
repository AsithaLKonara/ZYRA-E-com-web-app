"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Package, Search, Filter, Plus, Minus, Edit, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

interface InventoryItem {
  id: string
  name: string
  sku: string
  category: string
  brand: string
  price: number
  stockQuantity: number
  inStock: boolean
  createdAt: string
  updatedAt: string
}

interface InventoryStats {
  totalProducts: number
  totalStock: number
  lowStockCount: number
  outOfStockCount: number
}

export function InventoryManagement() {
  const { toast } = useToast()
  
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [lowStockFilter, setLowStockFilter] = useState(false)
  const [page, setPage] = useState(1)
  
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showBulkUpdate, setShowBulkUpdate] = useState(false)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  
  const [updateForm, setUpdateForm] = useState({
    action: 'set' as 'add' | 'subtract' | 'set',
    quantity: 0,
    reason: '',
    notes: ''
  })

  useEffect(() => {
    fetchInventory()
  }, [search, category, lowStockFilter, page])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      })

      if (search) params.set('search', search)
      if (category) params.set('category', category)
      if (lowStockFilter) params.set('lowStock', 'true')

      const response = await fetch(`/api/admin/inventory?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory')
      }

      const data = await response.json()
      setInventory(data.data.products)
      setStats(data.data.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateInventory = async (item: InventoryItem) => {
    try {
      const response = await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: item.id,
          ...updateForm
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update inventory')
      }

      toast({
        title: "Inventory updated!",
        description: `${item.name} inventory has been updated.`,
      })

      setShowUpdateDialog(false)
      setSelectedItem(null)
      setUpdateForm({ action: 'set', quantity: 0, reason: '', notes: '' })
      fetchInventory()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update inventory",
        variant: "destructive"
      })
    }
  }

  const handleBulkUpdate = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select items to update",
        variant: "destructive"
      })
      return
    }

    try {
      const updates = selectedItems.map(itemId => ({
        productId: itemId,
        action: updateForm.action,
        quantity: updateForm.quantity
      }))

      const response = await fetch('/api/admin/inventory', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updates,
          reason: updateForm.reason,
          notes: updateForm.notes
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update inventory')
      }

      const data = await response.json()
      
      toast({
        title: "Bulk update completed!",
        description: `${data.data.successful} items updated successfully.`,
      })

      setShowBulkUpdate(false)
      setSelectedItems([])
      setUpdateForm({ action: 'set', quantity: 0, reason: '', notes: '' })
      fetchInventory()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update inventory",
        variant: "destructive"
      })
    }
  }

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleSelectAll = () => {
    if (selectedItems.length === inventory.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(inventory.map(item => item.id))
    }
  }

  const getStockStatus = (quantity: number, inStock: boolean) => {
    if (!inStock || quantity === 0) {
      return { label: "Out of Stock", variant: "destructive" as const, icon: XCircle }
    } else if (quantity <= 10) {
      return { label: "Low Stock", variant: "destructive" as const, icon: AlertTriangle }
    } else if (quantity <= 50) {
      return { label: "Medium Stock", variant: "secondary" as const, icon: Package }
    } else {
      return { label: "In Stock", variant: "default" as const, icon: CheckCircle }
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <XCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Error Loading Inventory</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchInventory}>Try Again</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalProducts}</p>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalStock}</p>
                  <p className="text-sm text-muted-foreground">Total Stock</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.lowStockCount}</p>
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.outOfStockCount}</p>
                  <p className="text-sm text-muted-foreground">Out of Stock</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Management</CardTitle>
          <CardDescription>
            Manage product inventory and stock levels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products, SKU, or brand..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Clothing">Clothing</SelectItem>
                  <SelectItem value="Home">Home</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={lowStockFilter ? "default" : "outline"}
                onClick={() => setLowStockFilter(!lowStockFilter)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Low Stock
              </Button>
            </div>
          </div>

          {selectedItems.length > 0 && (
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
              </span>
              <Dialog open={showBulkUpdate} onOpenChange={setShowBulkUpdate}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Bulk Update
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bulk Update Inventory</DialogTitle>
                    <DialogDescription>
                      Update multiple items at once
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Action</Label>
                      <Select value={updateForm.action} onValueChange={(value: any) => 
                        setUpdateForm(prev => ({ ...prev, action: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="set">Set to specific amount</SelectItem>
                          <SelectItem value="add">Add to current amount</SelectItem>
                          <SelectItem value="subtract">Subtract from current amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={updateForm.quantity}
                        onChange={(e) => setUpdateForm(prev => ({ 
                          ...prev, 
                          quantity: parseInt(e.target.value) || 0 
                        }))}
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Reason</Label>
                      <Input
                        value={updateForm.reason}
                        onChange={(e) => setUpdateForm(prev => ({ ...prev, reason: e.target.value }))}
                        placeholder="e.g., Restock, Return, Adjustment"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={updateForm.notes}
                        onChange={(e) => setUpdateForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional notes..."
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowBulkUpdate(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleBulkUpdate}>
                        Update {selectedItems.length} Items
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === inventory.length && inventory.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="p-4 text-left font-medium">Product</th>
                  <th className="p-4 text-left font-medium">SKU</th>
                  <th className="p-4 text-left font-medium">Category</th>
                  <th className="p-4 text-left font-medium">Stock</th>
                  <th className="p-4 text-left font-medium">Status</th>
                  <th className="p-4 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => {
                  const stockStatus = getStockStatus(item.stockQuantity, item.inStock)
                  const StatusIcon = stockStatus.icon

                  return (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.brand}</p>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-mono">{item.sku}</td>
                      <td className="p-4 text-sm">{item.category}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.stockQuantity}</span>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                setSelectedItem(item)
                                setUpdateForm({
                                  action: 'subtract',
                                  quantity: 1,
                                  reason: '',
                                  notes: ''
                                })
                                setShowUpdateDialog(true)
                              }}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                setSelectedItem(item)
                                setUpdateForm({
                                  action: 'add',
                                  quantity: 1,
                                  reason: '',
                                  notes: ''
                                })
                                setShowUpdateDialog(true)
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={stockStatus.variant} className="flex items-center gap-1 w-fit">
                          <StatusIcon className="h-3 w-3" />
                          {stockStatus.label}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedItem(item)
                            setUpdateForm({
                              action: 'set',
                              quantity: item.stockQuantity,
                              reason: '',
                              notes: ''
                            })
                            setShowUpdateDialog(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Update
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Update Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Inventory</DialogTitle>
            <DialogDescription>
              Update stock for {selectedItem?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={updateForm.action} onValueChange={(value: any) => 
                setUpdateForm(prev => ({ ...prev, action: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="set">Set to specific amount</SelectItem>
                  <SelectItem value="add">Add to current amount</SelectItem>
                  <SelectItem value="subtract">Subtract from current amount</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={updateForm.quantity}
                onChange={(e) => setUpdateForm(prev => ({ 
                  ...prev, 
                  quantity: parseInt(e.target.value) || 0 
                }))}
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Reason</Label>
              <Input
                value={updateForm.reason}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="e.g., Restock, Return, Adjustment"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={updateForm.notes}
                onChange={(e) => setUpdateForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => selectedItem && handleUpdateInventory(selectedItem)}>
                Update Inventory
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}



