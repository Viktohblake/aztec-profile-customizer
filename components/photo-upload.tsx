"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { Upload, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PhotoUploadProps {
  onImageUpload: (imageUrl: string) => void
}

export function PhotoUpload({ onImageUpload }: PhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleFileUpload = useCallback(
    (file: File) => {
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          if (e.target?.result) {
            onImageUpload(e.target.result as string)
          }
        }
        reader.readAsDataURL(file)
      }
    },
    [onImageUpload],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFileUpload(files[0])
      }
    },
    [handleFileUpload],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFileUpload(files[0])
      }
    },
    [handleFileUpload],
  )

  return (
    <div
      className={`
        border-2 border-dashed rounded-lg p-8 text-center transition-colors
        ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
      `}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <ImageIcon className="w-6 h-6 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Drop your photo here</p>
          <p className="text-xs text-muted-foreground">or click to browse</p>
        </div>

        <Button variant="outline" size="sm" className="relative overflow-hidden bg-transparent">
          <Upload className="w-4 h-4 mr-2" />
          Choose File
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </Button>
      </div>
    </div>
  )
}
