'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CloudUpload, X, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PdfDropZoneProps {
  onChange: (file: File | null) => void
  error?: string
  currentFileName?: string
}

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

function validate(file: File): string {
  if (file.type !== 'application/pdf') return 'Only PDF files are allowed.'
  if (file.size > MAX_SIZE) return 'File must be under 10 MB.'
  return ''
}

export function PdfDropZone({ onChange, error, currentFileName }: PdfDropZoneProps): React.ReactElement {
  const [dragging, setDragging] = useState(false)
  const [selected, setSelected] = useState<File | null>(null)
  const [internalError, setInternalError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function pick(file: File | null) {
    if (!file) {
      setSelected(null)
      setInternalError('')
      onChange(null)
      return
    }
    const err = validate(file)
    if (err) {
      setInternalError(err)
      setSelected(null)
      onChange(null)
      return
    }
    setInternalError('')
    setSelected(file)
    onChange(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) pick(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) pick(file)
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation()
    pick(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const displayError = error ?? internalError
  const hasFile = selected || currentFileName

  return (
    <div className="w-full space-y-2">
      <motion.div
        whileHover={{ scale: 1.005 }}
        transition={{ duration: 0.15 }}
        onClick={() => !hasFile && inputRef.current?.click()}
        onDragEnter={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={(e) => { e.preventDefault(); setDragging(false) }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={cn(
          'relative flex min-h-[120px] cursor-pointer items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200',
          dragging
            ? 'border-indigo-400/70 bg-indigo-500/10'
            : displayError
              ? 'border-red-500/40 bg-red-500/5'
              : 'border-white/[0.12] bg-white/[0.02] hover:border-indigo-400/40 hover:bg-white/[0.04]',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          aria-label="Contract PDF"
          className="hidden"
          onChange={handleChange}
        />

        <AnimatePresence mode="wait">
          {hasFile ? (
            <motion.div
              key="selected"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex w-full items-center justify-between px-5 py-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                  <FileText className="h-5 w-5 text-red-400" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {selected?.name ?? currentFileName}
                  </p>
                  {selected && (
                    <p className="text-xs text-muted-foreground">{formatBytes(selected.size)}</p>
                  )}
                  {!selected && currentFileName && (
                    <p className="text-xs text-muted-foreground">Current attachment</p>
                  )}
                </div>
              </div>
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleRemove}
                className="ml-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-muted-foreground transition-colors hover:bg-red-500/20 hover:text-red-400"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center gap-2 p-8 text-center"
            >
              <CloudUpload className={cn('h-10 w-10 transition-colors', dragging ? 'text-indigo-400' : 'text-muted-foreground/60')} />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Drop PDF here or <span className="text-indigo-400">click to browse</span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">PDF only · max 10 MB</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {displayError && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-red-400"
          >
            {displayError}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
