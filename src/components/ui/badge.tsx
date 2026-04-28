import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-[var(--pg-accent-purple)] text-primary-foreground [a]:hover:bg-[var(--pg-accent-purple)]/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-[var(--pg-accent-danger)]/10 text-[var(--pg-accent-danger)] focus-visible:ring-[var(--pg-accent-danger)]/20 dark:bg-[var(--pg-accent-danger)]/20 dark:focus-visible:ring-[var(--pg-accent-danger)]/40 [a]:hover:bg-[var(--pg-accent-danger)]/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        blue: "bg-[var(--pg-accent-blue)]/12 text-[var(--pg-accent-blue)] ring-1 ring-[var(--pg-accent-blue)]/25 [a]:hover:bg-[var(--pg-accent-blue)]/18",
        cyan: "bg-[var(--pg-accent-cyan)]/12 text-[var(--pg-accent-cyan)] ring-1 ring-[var(--pg-accent-cyan)]/25 [a]:hover:bg-[var(--pg-accent-cyan)]/18",
        green: "bg-[var(--pg-accent-green)]/12 text-[var(--pg-accent-green)] ring-1 ring-[var(--pg-accent-green)]/25 [a]:hover:bg-[var(--pg-accent-green)]/18",
        amber: "bg-[var(--pg-accent-amber)]/12 text-[var(--pg-accent-amber)] ring-1 ring-[var(--pg-accent-amber)]/25 [a]:hover:bg-[var(--pg-accent-amber)]/18",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
