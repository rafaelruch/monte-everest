"use client"

import * as React from "react"
import { PricingCard, type PricingTier } from "@/components/ui/pricing-card"
import { Tab } from "@/components/ui/pricing-tab"

interface PricingSectionProps {
  title: string
  subtitle: string
  tiers: PricingTier[]
  frequencies: string[]
  onPlanSelect?: (tier: PricingTier, frequency: string) => void
}

export function PricingSection({
  title,
  subtitle,
  tiers,
  frequencies,
  onPlanSelect,
}: PricingSectionProps) {
  const [selectedFrequency, setSelectedFrequency] = React.useState(frequencies[0])

  const handlePlanSelect = (tier: PricingTier) => {
    onPlanSelect?.(tier, selectedFrequency)
  }

  return (
    <section className="flex flex-col items-center gap-10 py-10">
      <div className="space-y-7 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-medium md:text-5xl">{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        <div className="mx-auto flex w-fit rounded-full bg-muted p-1">
          {frequencies.map((freq) => (
            <Tab
              key={freq}
              text={freq}
              selected={selectedFrequency === freq}
              setSelected={setSelectedFrequency}
              discount={freq === "anual"}
            />
          ))}
        </div>
      </div>

      <div className="grid w-full max-w-6xl gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {tiers.map((tier) => (
          <PricingCard
            key={tier.id}
            tier={tier}
            paymentFrequency={selectedFrequency}
            onSelect={handlePlanSelect}
          />
        ))}
      </div>
    </section>
  )
}