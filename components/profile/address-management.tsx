"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, MapPin } from "lucide-react"

interface Address {
  id: string
  type: "home" | "work" | "other"
  firstName: string
  lastName: string
  company?: string
  street: string
  apartment?: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string
  isDefault: boolean
}

const mockAddresses: Address[] = [
  {
    id: "1",
    type: "home",
    firstName: "John",
    lastName: "Doe",
    street: "123 Main St",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "US",
    phone: "+1 (555) 123-4567",
    isDefault: true
  },
  {
    id: "2",
    type: "work",
    firstName: "John",
    lastName: "Doe",
    company: "Acme Corp",
    street: "456 Business Ave",
    apartment: "Suite 200",
    city: "New York",
    state: "NY",
    zipCode: "10002",
    country: "US",
    phone: "+1 (555) 987-6543",
    isDefault: false
  }
]

export function AddressManagement() {
  const [addresses, setAddresses] = useState<Address[]>(mockAddresses)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<Address>>({})

  const handleAdd = () => {
    setFormData({
      type: "home",
      country: "US"
    })
    setIsAdding(true)
  }

  const handleEdit = (address: Address) => {
    setFormData(address)
    setEditingId(address.id)
  }

  const handleSave = () => {
    if (editingId) {
      // Update existing address
      setAddresses(prev => 
        prev.map(addr => 
          addr.id === editingId 
            ? { ...addr, ...formData } as Address
            : addr
        )
      )
    } else {
      // Add new address
      const newAddress: Address = {
        id: Date.now().toString(),
        ...formData,
        isDefault: addresses.length === 0
      } as Address
      setAddresses(prev => [...prev, newAddress])
    }
    
    setIsAdding(false)
    setEditingId(null)
    setFormData({})
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({})
  }

  const handleDelete = (id: string) => {
    setAddresses(prev => prev.filter(addr => addr.id !== id))
  }

  const handleSetDefault = (id: string) => {
    setAddresses(prev => 
      prev.map(addr => ({
        ...addr,
        isDefault: addr.id === id
      }))
    )
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "home": return "bg-blue-100 text-blue-800"
      case "work": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Addresses
            </CardTitle>
            <CardDescription>
              Manage your shipping and billing addresses
            </CardDescription>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Address
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Address List */}
        {addresses.map((address) => (
          <div key={address.id} className="border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getTypeColor(address.type)}>
                    {address.type.charAt(0).toUpperCase() + address.type.slice(1)}
                  </Badge>
                  {address.isDefault && (
                    <Badge variant="outline">Default</Badge>
                  )}
                </div>
                
                <div className="space-y-1">
                  <p className="font-medium">
                    {address.firstName} {address.lastName}
                  </p>
                  {address.company && (
                    <p className="text-sm text-gray-600">{address.company}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    {address.street}
                    {address.apartment && `, ${address.apartment}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    {address.city}, {address.state} {address.zipCode}
                  </p>
                  <p className="text-sm text-gray-600">{address.country}</p>
                  <p className="text-sm text-gray-600">{address.phone}</p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(address)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(address.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {!address.isDefault && (
              <div className="mt-3 pt-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetDefault(address.id)}
                >
                  Set as Default
                </Button>
              </div>
            )}
          </div>
        ))}

        {/* Add/Edit Form */}
        {(isAdding || editingId) && (
          <Card className="border-2 border-dashed">
            <CardHeader>
              <CardTitle>
                {editingId ? "Edit Address" : "Add New Address"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Address Type</Label>
                  <Select
                    value={formData.type || "home"}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home">Home</SelectItem>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company">Company (Optional)</Label>
                  <Input
                    id="company"
                    value={formData.company || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Company name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="First name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={formData.street || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                  placeholder="123 Main St"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apartment">Apartment, Suite, etc. (Optional)</Label>
                <Input
                  id="apartment"
                  value={formData.apartment || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, apartment: e.target.value }))}
                  placeholder="Apt 4B"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="New York"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="NY"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                    placeholder="10001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={formData.country || "US"}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {editingId ? "Update Address" : "Add Address"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}



