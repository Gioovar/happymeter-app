"use client"

import React from 'react'
import 'react-phone-input-2/lib/style.css'
import './PhoneInput.css'
import dynamic from 'next/dynamic'

// Dynamically import PhoneInput2 to avoid SSR issues with window/document
const PhoneInput2 = dynamic(() => import('react-phone-input-2'), {
    ssr: false,
    loading: () => <div className="h-[50px] w-full bg-[#1a1a1a] rounded-xl animate-pulse" />
})

interface PhoneInputProps {
    value: string
    onChange: (phone: string) => void
    disabled?: boolean
    placeholder?: string
}

export default function PhoneInput({ value, onChange, disabled, placeholder }: PhoneInputProps) {
    return (
        <div className="text-black">
            <PhoneInput2
                country={'mx'}
                value={value}
                onChange={(phone) => onChange(phone)}
                disabled={disabled}
                placeholder={placeholder || "Ingresa 10 dígitos"}
                preferredCountries={['mx', 'us', 'co', 'es', 'ar', 'cl', 'pe']}
                onlyCountries={[]} // Allow all, but sort preferred
                masks={{ mx: '.. .. .. .. ..' }} // Optional formatting hint
                inputClass="!w-full !bg-[#1a1a1a] !text-white !border-white/10 !rounded-xl !h-[50px] !pl-[50px] !text-base focus:!border-violet-500 focus:!ring-2 focus:!ring-violet-500/20"
                buttonClass="!bg-[#1a1a1a] !border-white/10 !rounded-l-xl !px-1 hover:!bg-white/5"
                dropdownClass="!bg-[#1a1a1a] !text-white !border-white/10 scrollbar-dark"
                searchClass="!bg-[#2a2a2a] !text-white !border-white/10"
                containerClass="!w-full"
                enableSearch={true}
                disableSearchIcon={false}
                searchPlaceholder="Buscar país..."
                searchNotFound="No encontrado"
            />
        </div>
    )
}

