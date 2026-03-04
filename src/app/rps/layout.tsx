import type { Metadata } from 'next';

export const metadata: Metadata = {
    manifest: '/rps/manifest.json',
};

export default function RpsRootLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <script
                dangerouslySetInnerHTML={{
                    __html: `
                        if ('serviceWorker' in navigator) {
                            window.addEventListener('load', function() {
                                navigator.serviceWorker.register('/rps-sw.js', { scope: '/rps/' }).then(function(registration) {
                                    console.log('RPS ServiceWorker registration successful with scope: ', registration.scope);
                                }, function(err) {
                                    console.log('RPS ServiceWorker registration failed: ', err);
                                });
                            });
                        }
                    `
                }}
            />
            {children}
        </>
    );
}
