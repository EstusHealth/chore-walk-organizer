
import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface RecordingTranscriptionProps {
  audioBlob: Blob | null
  onTranscriptionComplete: (text: string) => void
}

const RecordingTranscription = ({
  audioBlob,
  onTranscriptionComplete,
}: RecordingTranscriptionProps) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null)
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

    // Validate blob before processing
    console.log(`Audio blob received: ${audioBlob.size} bytes, type: ${audioBlob.type}`)
    
    if (audioBlob.size < 1000) {
      console.log(`Audio blob too small (${audioBlob.size} bytes). Not processing.`)
      toast({
        title: "Recording Error",
        description: "The recording is too short or empty. Please try again.",
        variant: "destructive"
      })
      return
    }

    // We have a valid blob: generate preview URL and start transcription
    const url = URL.createObjectURL(audioBlob)
    setAudioUrl(url)
    setIsProcessing(true)
    setTranscriptionError(null)

    const processAudio = async () => {
      try {
        console.log('Starting transcription process...')
        
        // 1) Read the blob as a Data URL
        const reader = new FileReader()
        const dataUrl: string = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = (e) => {
            console.error('FileReader error:', e)
            reject(new Error('Failed to read audio file for transcription'))
          }
          reader.readAsDataURL(audioBlob)
        })

        // 2) Strip off "data:…;base64," prefix
        const parts = dataUrl.split(',')
        if (parts.length !== 2) {
          throw new Error('Invalid Data URL format from audio blob')
        }
        
        const rawBase64 = parts[1]
        console.log(`Audio base64 data length: ${rawBase64.length} characters`)

        // 3) Invoke Supabase Edge Function
        console.log('Invoking transcribe-audio function...')
        const { data, error } = await supabase.functions.invoke(
          'transcribe-audio',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audio: rawBase64,
              mimeType: audioBlob.type,
            }),
          }
        )

        // 4) Handle errors
        if (error) {
          console.error('Edge Function error:', error)
          throw new Error(
            `Transcription function error: ${error.message || 'Unknown error'}`
          )
        }

        // 5) Check for API errors returned in the data
        if (data?.error) {
          console.error('Transcription API error:', data.error)
          throw new Error(`API error: ${data.error}`)
        }

        // 6) Ensure we have text returned
        if (!data?.text) {
          console.error('No text field in transcription response:', data)
          throw new Error('Transcription succeeded but returned no text')
        }

        // 7) Success!
        console.log('Transcription result:', data.text)
        toast({
          title: 'Transcription Complete',
          description: 'Your recording was transcribed successfully using Google Speech-to-Text.',
        })
        onTranscriptionComplete(data.text)
      } catch (err: any) {
        console.error('Transcription error:', err)
        const errorMsg = err.message || 'Failed to transcribe audio.'
        setTranscriptionError(errorMsg)
        
        toast({
          title: 'Transcription Error',
          description: errorMsg,
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

    // Start processing with slight delay to ensure UI is updated first
    setTimeout(() => {
      processAudio()
    }, 100)

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
          <span>Transcribing your recording with Google Speech-to-Text...</span>
        </div>
      ) : transcriptionError ? (
        <div className="p-2 text-red-500 text-sm border border-red-200 rounded bg-red-50">
          <p>Error: {transcriptionError}</p>
          <p className="mt-1">Please try recording again with clear speech.</p>
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
