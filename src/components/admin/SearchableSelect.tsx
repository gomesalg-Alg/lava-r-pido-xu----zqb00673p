import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface SearchableOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  options: SearchableOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecionar...',
  searchPlaceholder = 'Buscar...',
  className,
  disabled,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !selected && 'text-slate-400',
            className,
          )}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          <CommandGroup className="max-h-60 overflow-y-auto">
            {options.map((o) => (
              <CommandItem
                key={o.value || 'empty'}
                value={o.label}
                onSelect={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn('mr-2 h-4 w-4', value === o.value ? 'opacity-100' : 'opacity-0')}
                />
                {o.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
