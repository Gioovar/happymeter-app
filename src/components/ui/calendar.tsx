"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import "react-day-picker/dist/style.css"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <>
            <style jsx global>{`
        .rdp {
          margin: 0;
          --rdp-cell-size: 40px;
          --rdp-accent-color: #7c3aed; /* Violet 600 */
          --rdp-background-color: rgba(124, 58, 237, 0.2);
        }
        .rdp-day_selected:not([disabled]), .rdp-day_selected:focus:not([disabled]), .rdp-day_selected:active:not([disabled]), .rdp-day_selected:hover:not([disabled]) {
          background-color: var(--rdp-accent-color);
          color: white;
          font-weight: bold;
        }
        .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
          background-color: rgba(255,255,255,0.1);
          color: white;
        }
        .rdp-day {
           color: #d1d5db; /* Gray 300 */
           border-radius: 100%;
        }
        /* Custom Available Day Highlight */
        .rdp-day_available {
           background-color: rgba(139, 92, 246, 0.15); /* Violet 500/15 */
           border: 1px solid rgba(139, 92, 246, 0.3);
           color: white;
           font-weight: 600;
        }
        .rdp-nav_button {
            width: 30px;
            height: 30px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .rdp-caption_label {
            color: white;
            font-size: 1rem;
            text-transform: capitalize; 
        }
        .rdp-head_cell {
            color: #9ca3af;
            font-size: 0.75rem;
            text-transform: uppercase;
        }
      `}</style>
            <DayPicker
                showOutsideDays={showOutsideDays}
                className={cn("p-4", className)}
                {...props}
            />
        </>
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
