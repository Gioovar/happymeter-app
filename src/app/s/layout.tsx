export default function SurveyLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            {/* next-pwa automatically injects the service worker into the root html.
                Manual registration here was causing scope conflicts and PWA validation failures. */}
        </>
    )
}
