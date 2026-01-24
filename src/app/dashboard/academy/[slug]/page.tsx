import { prisma } from '@/lib/prisma'
import { getUserProgress } from '@/actions/academy'
import AcademyPlayer from '@/components/academy/AcademyPlayer'
import { notFound } from 'next/navigation'

export default async function CoursePage({ params }: { params: { slug: string } }) {
    const course = await prisma.course.findUnique({
        where: { slug: params.slug },
        include: {
            modules: {
                orderBy: { order: 'asc' },
                include: {
                    lessons: {
                        where: { published: true },
                        orderBy: { order: 'asc' }
                    }
                }
            }
        }
    })

    if (!course) {
        notFound()
    }

    const progress = await getUserProgress()

    return (
        <AcademyPlayer
            course={course as any}
            initialProgress={progress}
        />
    )
}
