'use client'

import React, { useState } from 'react'
import { useDashboard } from '@/context/DashboardContext'
import FeatureGateModal from '../subscription/FeatureGateModal'

interface FeatureGuardProps {
    children: React.ReactNode
    feature: string
    fallback?: React.ReactNode // If provided, shows this instead of children when locked (optional)
    showLockIcon?: boolean // If true, might add a lock overlay (future enhancement)
}

export default function FeatureGuard({ children, feature, fallback, showLockIcon }: FeatureGuardProps) {
    const { checkFeature } = useDashboard()
    const isAllowed = checkFeature(feature)
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Helper to get feature details for the modal
    const getFeatureDetails = (key: string) => {
        switch (key) {
            case 'ai_analytics':
                return {
                    title: 'Desbloquea Análisis con IA',
                    description: 'Obtén insights profundos sobre el sentimiento de tus clientes y detecta problemas antes de que escalen.',
                    benefits: ['Análisis de sentimiento', 'Detección de palabras clave', 'Reportes automáticos']
                }
            case 'whatsapp_alerts':
                return {
                    title: 'Alertas en Tiempo Real por WhatsApp',
                    description: 'Recibe notificaciones instantáneas cuando un cliente deje una mala calificación.',
                    benefits: ['Notificaciones inmediatas', 'Recuperación de clientes', 'Sin configuraciones complejas']
                }
            case 'unlimited_surveys':
                return {
                    title: 'Encuestas Ilimitadas',
                    description: 'Elimina los límites y recolecta todo el feedback que necesites sin restricciones.',
                    benefits: ['Sin límite mensual', 'Histórico completo', 'Exportación de datos']
                }
            default:
                return {
                    title: 'Accede a funciones PRO',
                    description: 'Esta herramienta está reservada para usuarios con planes activos.',
                    benefits: ['Mejores resultados', 'Mayor control', 'Soporte prioritario']
                }
        }
    }

    const details = getFeatureDetails(feature)

    const handleInteraction = (e: React.MouseEvent) => {
        if (!isAllowed) {
            e.preventDefault()
            e.stopPropagation()
            setIsModalOpen(true)
        }
    }

    // Clone the child to attach the onClick handler if it's a valid React element
    // This effectively intercepts the click
    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            // @ts-ignore - We are injecting onClick, trusting user passes a clickable element
            return React.cloneElement(child, { onClick: handleInteraction })
        }
        return child
    })

    if (!isAllowed && fallback) {
        return (
            <>
                <div onClick={handleInteraction}>
                    {fallback}
                </div>
                <FeatureGateModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    {...details}
                />
            </>
        )
    }

    return (
        <>
            <div onClickCapture={!isAllowed ? handleInteraction : undefined} className={!isAllowed ? "cursor-pointer" : ""}>
                {children}
            </div>

            <FeatureGateModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                {...details}
            />
        </>
    )
}
