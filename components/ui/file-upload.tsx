"use client"

import { ChangeEvent, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ImageIcon, X } from "lucide-react"

interface FileUploadProps {
  onChange: (file: File | null) => void
  value?: File | null
  accept?: string
}

export function FileUpload({ onChange, accept }: FileUploadProps) {
  const [preview, setPreview] = useState<string>("")
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setPreview("")
      onChange(null)
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    onChange(file)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    handleFileSelect(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${
        isDragging ? "border-primary" : "border-border"
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <Input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleInputChange}
        accept={accept}
      />
      
      <div className="flex flex-col items-center justify-center gap-2">
        {preview ? (
          <>
            <div className="relative w-full max-w-md h-[200px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Preview"
                className="rounded-lg border border-border object-contain w-full h-full"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <>
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              Drop image here or click to browse
            </div>
          </>
        )}
      </div>
    </div>
  )
}
