import { auth } from '@clerk/nextjs/server'

export enum UserRole {
    SUPER_ADMIN = 'super_admin',
    CREATOR_ADMIN = 'creator_admin',
    CREATOR = 'creator',
    USER = 'user' // SaaS business owner
}

export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    CREATOR_ADMIN: 'creator_admin',
    CREATOR: 'creator',
    USER: 'user'
}

export async function getUserRole(): Promise<string> {
    const { sessionClaims } = await auth()
    return (sessionClaims?.metadata as any)?.role || ROLES.USER
}

export async function isSuperAdmin() {
    const role = await getUserRole()
    return role === ROLES.SUPER_ADMIN
}

export async function isCreatorAdmin() {
    const role = await getUserRole()
    return role === ROLES.SUPER_ADMIN || role === ROLES.CREATOR_ADMIN
}

export async function isCreator() {
    const role = await getUserRole()
    return role === ROLES.CREATOR
}
