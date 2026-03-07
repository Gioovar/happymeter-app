export default function SurveyLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <script
                dangerouslySetInnerHTML={{
                    __html: `
                        if ('serviceWorker' in navigator) {
                            window.addEventListener('load', function() {
                                navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(function(registration) {
                                  console.log('Survey SW registered: ', registration.scope);
                                }).catch(function(err) {
                                  console.log('Survey SW registration failed: ', err);
                                });
                            });
                        }
                    `
                }}
            />
        </>
    )
}
