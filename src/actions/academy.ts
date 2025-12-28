'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

// --- Admin Actions ---

export async function createCourse(data: { title: string, description?: string, coverImage?: string, slug: string }) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    // Check if admin (optional, assuming protected route handles this for now or check database role)
    // const user = await prisma.userSettings.findUnique({ where: { userId } })
    // if (user?.role !== 'SUPER_ADMIN') throw new Error('Forbidden')

    try {
        const course = await prisma.course.create({
            data: {
                ...data,
                published: true // auto-publish for now
            }
        })
        revalidatePath('/dashboard/academy')
        revalidatePath('/admin/academy')
        return { success: true, data: course }
    } catch (error) {
        console.error('Error creating course:', error)
        return { success: false, error: 'Failed to create course' }
    }
}

export async function createModule(data: { title: string, courseId: string, order: number }) {
    try {
        const mod = await prisma.module.create({
            data
        })
        revalidatePath('/admin/academy')
        return { success: true, data: mod }
    } catch (error) {
        return { success: false, error: 'Failed to create module' }
    }
}

export async function createLesson(data: {
    title: string,
    slug: string,
    videoUrl: string,
    moduleId: string,
    content?: string,
    order: number,
    duration?: number
}) {
    try {
        const lesson = await prisma.lesson.create({
            data
        })
        revalidatePath('/admin/academy')
        return { success: true, data: lesson }
    } catch (error) {
        console.error(error)
        return { success: false, error: 'Failed to create lesson' }
    }
}

// --- User Actions ---

export async function getAcademyData() {
    const courses = await prisma.course.findMany({
        where: { published: true },
        include: {
            modules: {
                orderBy: { order: 'asc' },
                include: {
                    lessons: {
                        orderBy: { order: 'asc' },
                        where: { published: true }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' } // Newest first
    })
    return courses
}

export async function getLesson(slug: string) {
    const lesson = await prisma.lesson.findFirst({
        where: { slug },
        include: {
            module: {
                include: {
                    course: true
                }
            }
        }
    })
    return lesson
}

export async function toggleLessonCompletion(lessonId: string) {
    const { userId } = await auth()
    if (!userId) return

    const existing = await prisma.userLessonProgress.findUnique({
        where: {
            userId_lessonId: {
                userId,
                lessonId
            }
        }
    })

    if (existing) {
        await prisma.userLessonProgress.delete({
            where: { id: existing.id }
        })
        return { completed: false }
    } else {
        await prisma.userLessonProgress.create({
            data: {
                userId,
                lessonId
            }
        })
        return { completed: true }
    }
}

export async function getUserProgress() {
    const { userId } = await auth()
    if (!userId) return []

    const progress = await prisma.userLessonProgress.findMany({
        where: { userId },
        select: { lessonId: true }
    })
    return progress.map((p: { lessonId: string }) => p.lessonId)
}
