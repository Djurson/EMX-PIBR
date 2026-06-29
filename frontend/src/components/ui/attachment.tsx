import * as React from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const attachmentVariants = cva(
  'relative flex items-center gap-3 rounded-lg border bg-card text-card-foreground shadow-sm transition-colors',
  {
    variants: {
      size: {
        default: 'p-3',
        sm: 'p-2',
        xs: 'p-1.5',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

interface AttachmentProps
  extends React.ComponentProps<'div'>,
    VariantProps<typeof attachmentVariants> {
  state?: 'idle' | 'uploading' | 'processing' | 'error' | 'done'
  orientation?: 'horizontal' | 'vertical'
}

function Attachment({
  className,
  size,
  state = 'idle',
  orientation = 'horizontal',
  ...props
}: AttachmentProps) {
  return (
    <div
      data-state={state}
      data-orientation={orientation}
      className={cn(
        attachmentVariants({ size }),
        state === 'error' && 'border-destructive/50 bg-destructive/5',
        state === 'done' && 'border-green-500/30 bg-green-500/5',
        orientation === 'vertical' && 'flex-col',
        className
      )}
      {...props}
    />
  )
}

const attachmentMediaVariants = cva(
  'flex shrink-0 items-center justify-center rounded-md',
  {
    variants: {
      variant: {
        icon: 'bg-muted text-muted-foreground',
        image: 'overflow-hidden bg-muted',
      },
      size: {
        default: 'size-10',
        sm: 'size-8',
        xs: 'size-6',
      },
    },
    defaultVariants: {
      variant: 'icon',
      size: 'default',
    },
  }
)

interface AttachmentMediaProps
  extends React.ComponentProps<'div'>,
    VariantProps<typeof attachmentMediaVariants> {}

function AttachmentMedia({ className, variant, size, ...props }: AttachmentMediaProps) {
  return (
    <div
      className={cn(attachmentMediaVariants({ variant, size }), className)}
      {...props}
    />
  )
}

function AttachmentContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex min-w-0 flex-1 flex-col gap-0.5', className)}
      {...props}
    />
  )
}

function AttachmentTitle({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      className={cn('truncate text-sm font-medium leading-none', className)}
      {...props}
    />
  )
}

function AttachmentDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      className={cn('truncate text-xs text-muted-foreground', className)}
      {...props}
    />
  )
}

function AttachmentActions({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex shrink-0 items-center gap-1', className)}
      {...props}
    />
  )
}

function AttachmentAction({ className, ...props }: React.ComponentProps<'button'>) {
  return (
    <button
      className={cn(
        'inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
}

function AttachmentTrigger({ className, ...props }: React.ComponentProps<'button'>) {
  return (
    <button
      className={cn(
        'absolute inset-0 rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        className
      )}
      {...props}
    />
  )
}

function AttachmentGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  )
}

export {
  Attachment,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
  AttachmentTrigger,
  AttachmentGroup,
}
