import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, Clock, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DateTimePickerProps {
  value?: string // Format: ISO 8601 with timezone
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  id?: string
  minDate?: Date
  showTimezone?: boolean
}

// Timezone used for scheduling (France)
const TIMEZONE = 'Europe/Paris'

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
const minutes = ['00', '15', '30', '45']

// Get the timezone offset string for Europe/Paris
const getTimezoneOffset = (): string => {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone: TIMEZONE,
    timeZoneName: 'shortOffset'
  })
  const parts = formatter.formatToParts(now)
  const offsetPart = parts.find(p => p.type === 'timeZoneName')
  return offsetPart?.value || 'UTC+1'
}

// Convert local date/time selection to ISO string with proper timezone
const toISOWithTimezone = (date: Date, hour: string, minute: string): string => {
  // Create a date string in the target timezone
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  // Build ISO string with explicit timezone
  const localDateStr = `${year}-${month}-${day}T${hour}:${minute}:00`
  
  // Create date in Paris timezone and convert to UTC ISO
  const parisDate = new Date(localDateStr)
  
  // Get the offset for Paris at this date
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  // We store in ISO format (UTC) but the input was in Paris time
  // So we need to calculate the UTC equivalent
  const parisOffset = getParisOffsetMinutes(parisDate)
  const utcDate = new Date(parisDate.getTime() - parisOffset * 60 * 1000)
  
  return utcDate.toISOString()
}

// Get Paris timezone offset in minutes for a given date
const getParisOffsetMinutes = (date: Date): number => {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
  const parisDate = new Date(date.toLocaleString('en-US', { timeZone: TIMEZONE }))
  return (parisDate.getTime() - utcDate.getTime()) / (1000 * 60)
}

// Parse ISO date and extract Paris local time
const parseToParisTime = (isoString: string): { date: Date; hour: string; minute: string } | null => {
  try {
    const utcDate = new Date(isoString)
    if (!isValid(utcDate)) return null
    
    // Convert to Paris time
    const parisFormatter = new Intl.DateTimeFormat('fr-FR', {
      timeZone: TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    
    const parts = parisFormatter.formatToParts(utcDate)
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || ''
    
    const year = parseInt(getPart('year'))
    const month = parseInt(getPart('month')) - 1
    const day = parseInt(getPart('day'))
    const hour = getPart('hour').padStart(2, '0')
    const minute = getPart('minute').padStart(2, '0')
    
    return {
      date: new Date(year, month, day),
      hour,
      minute
    }
  } catch {
    return null
  }
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Sélectionner date et heure",
  className,
  disabled,
  id,
  minDate,
  showTimezone = true
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>()
  const [selectedHour, setSelectedHour] = React.useState<string>('09')
  const [selectedMinute, setSelectedMinute] = React.useState<string>('00')

  const timezoneOffset = React.useMemo(() => getTimezoneOffset(), [])

  React.useEffect(() => {
    if (value) {
      // Try parsing as ISO first
      const parsed = parseToParisTime(value)
      if (parsed) {
        setSelectedDate(parsed.date)
        setSelectedHour(parsed.hour)
        setSelectedMinute(parsed.minute)
        return
      }
      
      // Fallback: try old format "yyyy-MM-dd'T'HH:mm"
      const fallbackParsed = parse(value, "yyyy-MM-dd'T'HH:mm", new Date())
      if (isValid(fallbackParsed)) {
        setSelectedDate(fallbackParsed)
        setSelectedHour(format(fallbackParsed, 'HH'))
        setSelectedMinute(format(fallbackParsed, 'mm'))
      }
    }
  }, [value])

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      const isoValue = toISOWithTimezone(date, selectedHour, selectedMinute)
      onChange?.(isoValue)
    }
  }

  const handleHourSelect = (hour: string) => {
    setSelectedHour(hour)
    if (selectedDate) {
      const isoValue = toISOWithTimezone(selectedDate, hour, selectedMinute)
      onChange?.(isoValue)
    }
  }

  const handleMinuteSelect = (minute: string) => {
    setSelectedMinute(minute)
    if (selectedDate) {
      const isoValue = toISOWithTimezone(selectedDate, selectedHour, minute)
      onChange?.(isoValue)
      setOpen(false)
    }
  }

  const displayValue = value && selectedDate && isValid(selectedDate)
    ? format(selectedDate, "d MMMM yyyy", { locale: fr }) + ` à ${selectedHour}:${selectedMinute}`
    : undefined

  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal h-10",
              !displayValue && "text-muted-foreground",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {displayValue || <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto max-w-[95vw] p-0" align="start" side="bottom" sideOffset={4}>
          <div className="flex flex-col pointer-events-auto">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => minDate ? date < minDate : false}
              initialFocus
              locale={fr}
              className="p-3 pointer-events-auto"
            />
            <div className="flex border-t">
              <div className="flex-1 border-r">
                <div className="px-3 py-2 text-sm font-medium text-center border-b bg-muted flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" />
                  Heure
                </div>
                <ScrollArea className="h-[120px]">
                  <div className="p-1 grid grid-cols-4 gap-1">
                    {hours.map((hour) => (
                      <Button
                        key={hour}
                        variant={selectedHour === hour ? "default" : "ghost"}
                        className="justify-center px-2 py-1.5 text-sm h-8"
                        onClick={() => handleHourSelect(hour)}
                      >
                        {hour}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <div className="flex-1">
                <div className="px-3 py-2 text-sm font-medium text-center border-b bg-muted">
                  Min
                </div>
                <ScrollArea className="h-[120px]">
                  <div className="p-1 grid grid-cols-2 gap-1">
                    {minutes.map((minute) => (
                      <Button
                        key={minute}
                        variant={selectedMinute === minute ? "default" : "ghost"}
                        className="justify-center px-2 py-1.5 text-sm h-8"
                        onClick={() => handleMinuteSelect(minute)}
                      >
                        {minute}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
            {/* Timezone indicator */}
            <div className="px-3 py-2 border-t bg-muted/50 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" />
              <span>Fuseau horaire : <strong className="text-foreground">{TIMEZONE}</strong> ({timezoneOffset})</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {showTimezone && displayValue && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Globe className="h-3 w-3" />
          {TIMEZONE} ({timezoneOffset})
        </p>
      )}
    </div>
  )
}
