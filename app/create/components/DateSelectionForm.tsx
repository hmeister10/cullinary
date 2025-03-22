"use client"

import React from "react"
import { format, addDays } from "date-fns"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface DateSelectionFormProps {
  startDate: Date
  setStartDate: (date: Date) => void
}

export function DateSelectionForm({ startDate, setStartDate }: DateSelectionFormProps) {
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col space-y-1.5">
        <label
          htmlFor="date"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Start Date
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !startDate && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={(date) => date && setStartDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      {/* Display the date range for the menu */}
      <div className="text-sm text-muted-foreground">
        Your menu will be for 7 days, from <span className="font-medium">{format(startDate, "PPP")}</span> to{" "}
        <span className="font-medium">{format(addDays(startDate, 6), "PPP")}</span>
      </div>
    </div>
  )
} 