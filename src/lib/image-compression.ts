/**
 * Compresses an image file using the browser's Canvas API.
 * Prioritizes AVIF, falls back to WebP, then JPEG.
 * Resizes large images to a maximum dimension (default 1280px).
 */
export async function compressImage(file: File, quality = 0.7, maxWidth = 1280): Promise<string> {
    return new Promise((resolve, reject) => {
        const image = new Image()
        image.src = URL.createObjectURL(file)

        image.onload = () => {
            URL.revokeObjectURL(image.src)
            const canvas = document.createElement('canvas')
            let width = image.width
            let height = image.height

            // Calculate new dimensions
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width)
                width = maxWidth
            }

            canvas.width = width
            canvas.height = height

            const ctx = canvas.getContext('2d')
            if (!ctx) {
                reject(new Error('Could not get canvas context'))
                return
            }

            ctx.drawImage(image, 0, 0, width, height)

            // Try exporting to different formats
            const tryFormat = (mimeType: string): string => {
                try {
                    return canvas.toDataURL(mimeType, quality)
                } catch (e) {
                    return ''
                }
            }

            // Attempt AVIF
            let dataUrl = tryFormat('image/avif')

            // Fallback to WebP if AVIF fails or returns a long PNG (browser fallback)
            // Note: Some browsers allow toDataURL('image/avif') but return image/png if unsupported
            if (!dataUrl || dataUrl.startsWith('data:image/png')) {
                dataUrl = tryFormat('image/webp')
            }

            // Fallback to JPEG if WebP fails
            if (!dataUrl || dataUrl.startsWith('data:image/png')) {
                dataUrl = tryFormat('image/jpeg')
            }

            resolve(dataUrl)
        }

        image.onerror = (error) => reject(error)
    })
}
