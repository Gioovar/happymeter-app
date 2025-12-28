import { getAcademyData } from '@/actions/academy'
import ContentManager from '@/components/admin/academy/ContentManager'

export default async function AdminAcademyPage() {
    const courses = await getAcademyData()

    return (
        <div className="p-8 max-w-[1600px] mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">HappyMeter Academy CMS</h1>
                <p className="text-gray-400">
                    Sube tutoriales y cursos para los usuarios. Estructura: Curso {'>'} Módulos {'>'} Lecciones.
                </p>
                <div className="h-1 w-24 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full mt-4" />
            </header>

            <ContentManager initialCourses={courses} />

        </div>
    )
}
