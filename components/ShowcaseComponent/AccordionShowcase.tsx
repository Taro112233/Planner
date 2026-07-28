// components/ShowcaseComponent/AccordionShowcase.tsx
"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export function AccordionShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Accordion</h3>
      <p className="text-sm text-muted-foreground">
        Vertically collapsing accordion panels for organizing content.
      </p>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Single Accordion */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Single Expand</h4>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Is it accessible?</AccordionTrigger>
              <AccordionContent>
                Yes. It adheres to the WAI-ARIA design pattern.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Is it styled?</AccordionTrigger>
              <AccordionContent>
                Yes. It comes with default styles that matches the other components&apos; aesthetic.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Is it animated?</AccordionTrigger>
              <AccordionContent>
                Yes. It&apos;s animated by default, but you can disable it if you prefer.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Multiple Accordion */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Multiple Expand</h4>
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="faq-1">
              <AccordionTrigger>What is your return policy?</AccordionTrigger>
              <AccordionContent>
                We offer a 30-day return policy for all unused items in their original packaging.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-2">
              <AccordionTrigger>How long does shipping take?</AccordionTrigger>
              <AccordionContent>
                Standard shipping takes 5-7 business days. Express shipping is available for 2-3 business days.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-3">
              <AccordionTrigger>Do you ship internationally?</AccordionTrigger>
              <AccordionContent>
                Yes, we ship to over 100 countries worldwide. International shipping rates apply.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  )
}