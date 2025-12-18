export interface DiceItem {
    text: string
    icon: string
    color?: string // Tailwind color class for text
}

export interface CoupleDiceConfig {
    standardActions: DiceItem[]
    extremeActions: DiceItem[]
    standardBodyParts: DiceItem[]
    extremeBodyParts: DiceItem[]
    intensity: 'standard' | 'extreme'
}

export const DEFAULT_STANDARD_ACTIONS: DiceItem[] = [
    { text: "Besar", icon: "💋", color: "text-red-500" },
    { text: "Masajear", icon: "👐", color: "text-purple-400" },
    { text: "Lamer", icon: "👅", color: "text-pink-500" },
    { text: "Morder", icon: "🦷", color: "text-red-400" },
    { text: "Acariciar", icon: "✋", color: "text-orange-300" },
    { text: "Susurrar", icon: "🤫", color: "text-blue-200" }
]

export const DEFAULT_EXTREME_ACTIONS: DiceItem[] = [
    { text: "Chupar", icon: "🌪️", color: "text-red-600" },
    { text: "Azotar", icon: "👋", color: "text-red-700" },
    { text: "Body Shot", icon: "🥃", color: "text-amber-500" }, // New request
    { text: "Apretar", icon: "✊", color: "text-purple-600" },
    { text: "Vendar", icon: "🧣", color: "text-gray-400" },
    { text: "Hielo", icon: "🧊", color: "text-cyan-400" }
]

export const DEFAULT_STANDARD_BODY_PARTS: DiceItem[] = [
    { text: "Cuello", icon: "🦒" },
    { text: "Oreja", icon: "👂" },
    { text: "Labios", icon: "👄" },
    { text: "Muslos", icon: "🦵" },
    { text: "Espalda", icon: "🔙" },
    { text: "Ombligo", icon: "🥯" }
]

export const DEFAULT_EXTREME_BODY_PARTS: DiceItem[] = [
    { text: "Pecho", icon: "🍒" }, // New request
    { text: "Trasero", icon: "🍑" },
    { text: "Entrepierna", icon: "🍆" }, // New request "más abajo"
    { text: "Pezones", icon: "🍩" },
    { text: "Pies", icon: "🦶" },
    { text: "Axila", icon: "💪" }
]
