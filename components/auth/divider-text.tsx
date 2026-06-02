'use client'

interface DividerTextProps {
  text: string
}

export function DividerText({ text }: DividerTextProps) {
  return (
    <div className="relative flex items-center gap-4 my-6">
      <div className="flex-1 h-px bg-border" />
      <span className="text-sm text-muted-foreground font-medium">{text}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}
