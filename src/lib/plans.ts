export const PLAN_LIMITS = {
    FREE: {
        code: 'FREE',
        name: 'Starter Test',
        maxResponses: 50,
        limits: {
            satisfactionSurveys: 1,
            staffSurveys: 1,
            games: 2,
            teamMembers: 2
        },
        features: {
            branding: true,
            advancedReports: false,
            apiAccess: false,
            automation: true,
            exportData: true,
            multiLanguage: true,
            whiteLabel: false,
            teamRoles: true,
            sso: false,
            aiAnalysis: true,
            staffAlerts: true,
            whatsappCampaigns: false
        }
    },
    GROWTH: {
        code: 'GROWTH',
        name: 'Growth 1K',
        maxResponses: 1000,
        limits: {
            satisfactionSurveys: 1,
            staffSurveys: 1,
            games: 2,
            teamMembers: 2
        },
        features: {
            branding: true,
            advancedReports: false,
            apiAccess: false,
            automation: true,
            exportData: true,
            multiLanguage: true,
            whiteLabel: false,
            teamRoles: true,
            sso: false,
            aiAnalysis: true,
            staffAlerts: true,
            whatsappCampaigns: false
        }
    },
    POWER: {
        code: 'POWER',
        name: 'Power 3X',
        maxResponses: Infinity,
        limits: {
            satisfactionSurveys: 3,
            staffSurveys: 3,
            games: 999, // All games
            teamMembers: 6
        },
        features: {
            branding: true,
            advancedReports: true,
            apiAccess: false,
            automation: true,
            crm: true,
            exportData: true,
            multiLanguage: true,
            whiteLabel: true,
            teamRoles: true,
            sso: false,
            aiAnalysis: true,
            staffAlerts: true,
            whatsappCampaigns: true
        }
    },
    CHAIN: {
        code: 'CHAIN',
        name: 'Chain Master 100',
        maxResponses: Infinity,
        limits: {
            satisfactionSurveys: 50,
            staffSurveys: 50,
            games: 999,
            teamMembers: 999
        },
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
            sso: true,
            aiAnalysis: true,
            staffAlerts: true,
            whatsappCampaigns: true
        }
    },
    ENTERPRISE: {
        code: 'ENTERPRISE',
        name: 'HappyMeter Infinity',
        maxResponses: Infinity,
        limits: {
            satisfactionSurveys: Infinity,
            staffSurveys: Infinity,
            games: Infinity,
            teamMembers: Infinity
        },
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
