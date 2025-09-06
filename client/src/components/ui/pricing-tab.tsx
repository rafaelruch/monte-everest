"use client"

import * as React from "react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface TabProps {
  text: string
  selected: boolean
  setSelected: (text: string) => void
  discount?: boolean
}

export function Tab({ text, selected, setSelected, discount }: TabProps) {
  return (
    <button
      onClick={() => setSelected(text)}
      className={cn(
        "relative px-4 py-2 text-sm font-medium transition-colors capitalize",
        selected
          ? "text-primary-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {selected && (
        <motion.div
          layoutId="tab-indicator"
          className="absolute inset-0 rounded-full bg-primary"
          initial={false}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        {text}
        {discount && selected && (
          <Badge variant="secondary" className="text-xs">
            20% off
          </Badge>
        )}
      </span>
    </button>
  )
}