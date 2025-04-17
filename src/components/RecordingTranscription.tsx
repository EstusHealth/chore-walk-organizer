// src/components/RecordingTranscription.tsx

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface RecordingTranscriptionProps {
  audioBlob: Blob | null
  onTranscriptionComplete: (text: string) => void
}

// Minimum blob size (bytes) before we consider the recording "finished"
const MIN_BLOB_SIZE = 1024

const RecordingTranscription = ({
  audioBlob,
  onTranscriptionComplete,
}: RecordingTranscriptionProps) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Clean up any previous URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }

    if (!audioBlob) {
      // No recording yet
      return
    }

    // If the blob is very small, assume recording is still in progress
    if (audioBlob.size < MIN_BLOB_SIZE) {
      console.log(
        `Blob too small (${audioBlob.size} bytes)—waiting for full recording before transcribing.`
      )
      return
    }

    // We have a complete blob: generate preview URL and start transcription
    const url = URL.createObjectURL(audioBlob)
    setAudioUrl(url)
    setIsProcessing(true)

    const processAudio = async () => {
      try {
        // 1) Read the blob as a Data‑URL
        const reader = new FileReader()
        const dataUrl: string = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = () =>
            reject(new Error('Failed to read audio file for transcription'))
          reader.readAsDataURL(audioBlob)
        })

        // 2) Strip off "data:…;base64," prefix
        const parts = dataUrl.split(',')
        if (parts.length !== 2) {
          throw new Error('Invalid Data‑URL from audio blob')
        }
        const rawBase64 = parts[1]

        // 3) Invoke your Supabase Edge Function with POST
        const payload = JSON.stringify({
          audio: rawBase64,
          mimeType: audioBlob.type,
        })

        console.log(
          'Invoking transcribe-audio (POST)… payload bytes:',
          payload.length
        )
        const { data, error, status } = await supabase.functions.invoke(
          'transcribe-audio',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
          }
        )

        // 4) Handle errors
        if (error || status < 200 || status >= 300) {
          console.error('Edge Function error:', { status, error, data })
          throw new Error(
            `Transcription function returned status ${status}${
              error?.message ? `: ${error.message}` : ''
            }`
          )
        }

        // 5) Ensure we have text returned
        if (!data?.text) {
          console.error('No text field in transcription response:', data)
          throw new Error('Transcription succeeded but returned no text')
        }

        // 6) Success!
        console.log('Transcription result:', data.text)
        toast({
          title: 'Transcription Complete',
          description: 'Your recording was transcribed successfully.',
        })
        onTranscriptionComplete(data.text)
      } catch (err: any) {
        console.error('Transcription error:', err)
        toast({
          title: 'Transcription Error',
          description: err.message || 'Failed to transcribe audio.',
          variant: 'destructive',
        })

        // In development, you can choose to fallback
        if (process.env.NODE_ENV === 'development') {
          onTranscriptionComplete(
            '🛠️ Dev fallback: transcription failed.'
          )
        }
      } finally {
        setIsProcessing(false)
      }
    }

    processAudio()

    return () => {
      // Cleanup when unmounting or blob changes
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioBlob, onTranscriptionComplete, toast])

  // Don't render until we have a previewable recording
  if (!audioBlob || !audioUrl) {
    return null
  }

  return (
    <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
      <h3 className="font-medium mb-2">Recording Preview</h3>
      <audio src={audioUrl} controls className="w-full mb-3" />

      {isProcessing ? (
        <div className="flex items-center justify-center p-4 text-chore-600">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span>Transcribing your recording...</span>
        </div>
      ) : (
        <p className="text-sm text-gray-600">
          Ready to add tasks from this recording.
        </p>
      )}
    </div>
  )
}

export default RecordingTranscription
