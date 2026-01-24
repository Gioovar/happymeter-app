
import { useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'

interface UseAudioRecorderReturn {
    isRecording: boolean
    recordingTime: number
    startRecording: () => Promise<void>
    stopRecording: () => Promise<Blob | null>
    cancelRecording: () => void
    hasMicrophonePermission: boolean
}

export function useAudioRecorder(): UseAudioRecorderReturn {
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [hasMicrophonePermission, setHasMicrophonePermission] = useState(false)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            setHasMicrophonePermission(true)

            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data)
                }
            }

            mediaRecorder.start()
            setIsRecording(true)

            // Timer
            const startTime = Date.now()
            timerRef.current = setInterval(() => {
                setRecordingTime(Math.floor((Date.now() - startTime) / 1000))
            }, 1000)

        } catch (error) {
            console.error('Error accessing microphone:', error)
            toast.error('No se pudo acceder al micrófono. Verifica los permisos.')
            setHasMicrophonePermission(false)
        }
    }, [])

    const stopRecording = useCallback(async (): Promise<Blob | null> => {
        if (!mediaRecorderRef.current) return null

        return new Promise((resolve) => {
            const mediaRecorder = mediaRecorderRef.current!

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' }) // or audio/mp4 if supported
                reset()
                resolve(blob)
            }

            // Stop recorder and tracks
            mediaRecorder.stop()
            mediaRecorder.stream.getTracks().forEach(track => track.stop())
        })
    }, [])

    const cancelRecording = useCallback(() => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop()
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
        }
        reset()
    }, [])

    const reset = () => {
        setIsRecording(false)
        setRecordingTime(0)
        chunksRef.current = []
        if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
        mediaRecorderRef.current = null
    }

    return {
        isRecording,
        recordingTime,
        startRecording,
        stopRecording,
        cancelRecording,
        hasMicrophonePermission
    }
}
