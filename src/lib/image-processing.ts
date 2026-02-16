
import { upload } from '@vercel/blob/client';
import imageCompression from 'browser-image-compression';
import heic2any from 'heic2any';

export interface ProcessedUploadResult {
    url: string;
    originalName: string;
}

export async function processAndUploadImage(
    file: File,
    onProgress?: (progress: number) => void
): Promise<ProcessedUploadResult> {
    try {
        let fileToProcess = file;

        // 1. HEIC/HEIF Conversion
        if (
            file.type === 'image/heic' ||
            file.type === 'image/heif' ||
            file.name.toLowerCase().endsWith('.heic') ||
            file.name.toLowerCase().endsWith('.heif')
        ) {
            console.log('Converting HEIC to JPEG...');
            const convertedBlob = await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.9
            });

            // heic2any can return an array if multiple images, handle single
            const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

            fileToProcess = new File(
                [blob],
                file.name.replace(/\.(heic|heif)$/i, '.jpg'),
                { type: 'image/jpeg' }
            );
        }

        // 2. Compression (Client-side)
        console.log('Compressing image...');
        const options = {
            maxSizeMB: 1, // Max 1MB
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            fileType: 'image/webp', // Convert to efficient WebP
            initialQuality: 0.8,
            onProgress: (p: number) => {
                // Compression progress (0-100)
                // We map this to 0-50% of total progress logic if detailed
                // But simplified, we just log/ignore or separate stages
            }
        };

        const compressedFile = await imageCompression(fileToProcess, options);
        console.log(`Original: ${(file.size / 1024 / 1024).toFixed(2)}MB, Compressed: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);

        // 3. Upload to Vercel Blob
        console.log('Uploading to Vercel Blob...');

        const uniqueName = `evidence-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;

        const newBlob = await upload(uniqueName, compressedFile, {
            access: 'public',
            handleUploadUrl: '/api/upload',
            clientPayload: JSON.stringify({
                originalName: file.name
            }),
            onUploadProgress: (progressEvent) => {
                if (onProgress) {
                    onProgress(progressEvent.percentage);
                }
            }
        });

        return {
            url: newBlob.url,
            originalName: file.name
        };

    } catch (error) {
        console.error('Image processing/upload failed:', error);
        throw error;
    }
}
