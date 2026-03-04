import type { Metadata } from 'next';

export const metadata: Metadata = {
    manifest: '/ops/manifest.json',
};

export default function OpsRootLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <script
                dangerouslySetInnerHTML={{
                    __html: `
                        if ('serviceWorker' in navigator) {
                            window.addEventListener('load', function() {
                                navigator.serviceWorker.register('/ops-sw.js', { scope: '/ops/' }).then(function(registration) {
                                    console.log('OPS ServiceWorker registration successful with scope: ', registration.scope);
                                }, function(err) {
                                    console.log('OPS ServiceWorker registration failed: ', err);
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
