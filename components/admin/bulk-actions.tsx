"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  MoreHorizontal, 
  Trash2, 
  Edit, 
  Eye, 
  Download,
  Archive,
  Tag
} from "lucide-react"

interface BulkActionsProps {
  selectedItems: string[]
  onBulkAction: (action: string, items: string[]) => void
  onSelectAll: (checked: boolean) => void
  totalItems: number
  className?: string
}

export function BulkActions({ 
  selectedItems, 
  onBulkAction, 
  onSelectAll, 
  totalItems,
  className 
}: BulkActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const allSelected = selectedItems.length === totalItems
  const someSelected = selectedItems.length > 0 && selectedItems.length < totalItems

  const handleSelectAll = (checked: boolean) => {
    onSelectAll(checked)
  }

  const handleBulkAction = (action: string) => {
    onBulkAction(action, selectedItems)
    setIsOpen(false)
  }

  if (selectedItems.length === 0) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Checkbox
          checked={allSelected}
          onCheckedChange={handleSelectAll}
        />
        <span className="text-sm text-gray-600">
          Select all ({totalItems})
        </span>
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <div className="flex items-center space-x-2">
        <Checkbox
          checked={allSelected}
          onCheckedChange={handleSelectAll}
        />
        <span className="text-sm text-gray-600">
          {selectedItems.length} selected
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleBulkAction("delete")}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleBulkAction("toggle-stock")}
        >
          <Edit className="h-4 w-4 mr-1" />
          Toggle Stock
        </Button>

        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleBulkAction("mark-featured")}>
              <Tag className="h-4 w-4 mr-2" />
              Mark as Featured
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkAction("mark-new")}>
              <Tag className="h-4 w-4 mr-2" />
              Mark as New
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkAction("archive")}>
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkAction("export")}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
