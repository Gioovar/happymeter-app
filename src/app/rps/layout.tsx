import type { Metadata } from 'next';

export const metadata: Metadata = {
    manifest: '/rps/manifest.json',
};

export default function RpsRootLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
