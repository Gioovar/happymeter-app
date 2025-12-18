export const PLAN_LIMITS = {
    FREE: {
        code: 'FREE',
        name: 'Starter Test',
        maxSurveys: 1,
        maxResponses: 50,
        features: {
            branding: false,
            advancedReports: false,
            apiAccess: false,
            automation: false,
            exportData: false,
            multiLanguage: false,
            whiteLabel: false,
            teamRoles: false,
            sso: false,
            aiAnalysis: false,
            staffAlerts: false,
            whatsappCampaigns: false
        }
    },
    GROWTH: {
        code: 'GROWTH',
        name: 'Growth 1K',
        maxSurveys: 1,
        maxResponses: 1000,
        features: {
            branding: true,
            advancedReports: false, // Basic checking
            apiAccess: false,
            automation: true,
            exportData: true, // Added
            multiLanguage: true, // Added
            whiteLabel: false,
            teamRoles: false,
            sso: false,
            aiAnalysis: true, // Basic AI
            staffAlerts: true, // New Feature
            whatsappCampaigns: false
        }
    },
    POWER: {
        code: 'POWER',
        name: 'Power 3X',
        maxSurveys: 3,
        maxResponses: Infinity,
        features: {
            branding: true,
            advancedReports: true,
            apiAccess: false,
            automation: true,
            crm: true,
            exportData: true,
            multiLanguage: true,
            whiteLabel: true, // Added
            teamRoles: true, // Added (3 seats)
            sso: false,
            aiAnalysis: true, // Advanced AI
            staffAlerts: true,
            whatsappCampaigns: true // New Feature
        }
    },
    CHAIN: {
        code: 'CHAIN',
        name: 'Chain Master 100',
        maxSurveys: 100,
        maxResponses: Infinity,
        features: {
            branding: true,
            advancedReports: true,
            apiAccess: true,
            automation: true,
            comparativeDashboard: true,
            exportData: true,
            multiLanguage: true,
            whiteLabel: true,
            teamRoles: true,
            sso: true, // Added
            aiAnalysis: true,
            staffAlerts: true,
            whatsappCampaigns: true
        }
    },
    ENTERPRISE: {
        code: 'ENTERPRISE',
        name: 'HappyMeter Infinity',
        maxSurveys: Infinity,
        maxResponses: Infinity,
        features: {
            branding: true,
            advancedReports: true,
            apiAccess: true,
            automation: true,
            customIntegrations: true,
            exportData: true,
            multiLanguage: true,
            whiteLabel: true,
            teamRoles: true,
            sso: true,
            aiAnalysis: true,
            staffAlerts: true,
            whatsappCampaigns: true
        }
    }
} as const

export type PlanType = keyof typeof PLAN_LIMITS

export const PRICING = {
    FREE: { monthly: 0, yearly: 0 },
    GROWTH: { monthly: 29, yearly: 290 },
    POWER: { monthly: 79, yearly: 790 },
    CHAIN: { monthly: 299, yearly: 2990 },
    ENTERPRISE: { monthly: null, yearly: null } // Contact Sales
}
