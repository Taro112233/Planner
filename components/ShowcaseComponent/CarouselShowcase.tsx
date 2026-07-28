// components/ShowcaseComponent/CarouselShowcase.tsx
"use client"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"

export function CarouselShowcase() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Carousel</h3>
      <p className="text-sm text-muted-foreground">
        A carousel with motion and swipe built using Embla.
      </p>
      
      <div className="space-y-8">
        {/* Default Carousel */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Default</h4>
          <div className="w-full max-w-sm mx-auto">
            <Carousel className="w-full">
              <CarouselContent>
                {Array.from({ length: 5 }).map((_, index) => (
                  <CarouselItem key={index}>
                    <div className="p-1">
                      <Card>
                        <CardContent className="flex aspect-square items-center justify-center p-6">
                          <span className="text-4xl font-semibold">{index + 1}</span>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>

        {/* Multiple Items */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Multiple Items</h4>
          <div className="w-full max-w-3xl mx-auto">
            <Carousel
              opts={{
                align: "start",
              }}
              className="w-full"
            >
              <CarouselContent>
                {Array.from({ length: 8 }).map((_, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-1">
                      <Card>
                        <CardContent className="flex aspect-square items-center justify-center p-6 gradient-brand-semantic text-primary-foreground">
                          <span className="text-3xl font-semibold">{index + 1}</span>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>

        {/* Vertical Carousel */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Vertical</h4>
          <div className="w-full max-w-xs mx-auto">
            <Carousel
              opts={{
                align: "start",
              }}
              orientation="vertical"
              className="w-full"
            >
              <CarouselContent className="-mt-1 h-[200px]">
                {Array.from({ length: 5 }).map((_, index) => (
                  <CarouselItem key={index} className="pt-1 md:basis-1/2">
                    <div className="p-1">
                      <Card>
                        <CardContent className="flex items-center justify-center p-6 bg-surface-interactive text-content-primary">
                          <span className="text-2xl font-semibold">{index + 1}</span>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>
      </div>
    </div>
  )
}