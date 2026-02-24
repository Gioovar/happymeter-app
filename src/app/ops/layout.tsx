import type { Metadata } from 'next';

export const metadata: Metadata = {
    manifest: '/ops/manifest.json',
};

export default function OpsRootLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
