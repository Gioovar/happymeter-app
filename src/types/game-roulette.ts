export type RouletteRule = 'common' | 'rare' | 'fixed_interval'

export interface RouletteOutcome {
    id: string
    label: string
    short: string // For the wheel segment
    color: string
    iconType: 'beer' | 'skull' | 'water' | 'poop' | 'star'
    rule: RouletteRule
    interval?: number // e.g., 50 (for 'every 50 spins')
    probability: number // 0-1 for common/rare
}

export const DEFAULT_ROULETTE_CONFIG: RouletteOutcome[] = [
    { id: '1', label: 'Bebe 1 Shot', short: '1 SHOT', color: '#ef4444', iconType: 'beer', rule: 'common', probability: 0.3 },
    { id: '2', label: 'No Bebes', short: 'SALVADO', color: '#22c55e', iconType: 'star', rule: 'common', probability: 0.25 },
    { id: '3', label: 'Bebe 2 Shots', short: '2 SHOTS', color: '#dc2626', iconType: 'beer', rule: 'common', probability: 0.2 },
    { id: '4', label: 'Toma Agua', short: 'AGUA', color: '#3b82f6', iconType: 'water', rule: 'common', probability: 0.15 },
    { id: '5', label: 'Bebe 4 Shots', short: '4 SHOTS', color: '#7f1d1d', iconType: 'skull', rule: 'fixed_interval', interval: 50, probability: 0 },
    { id: '6', label: 'Invitas 1 Shot', short: 'INVITA', color: '#eab308', iconType: 'star', rule: 'fixed_interval', interval: 25, probability: 0 },
]
