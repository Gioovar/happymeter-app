
import HappyLoader from '@/components/HappyLoader'

export default function Loading() {
    return (
        <div className="flex items-center justify-center h-[70vh]">
            <HappyLoader size="lg" text="Cargando Panel Admin..." />
        </div>
    )
}
