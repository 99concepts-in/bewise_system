'use client'
/** @module onboarding @owner CLIENT @screens CL-05b Your photo (camera / gallery, optional). @sensitive */
import { useRouter } from 'next/navigation'
import { OnboardShell } from '@/components/onboard-shell'
import { PhotoCapture } from '@/components/camera'
import { useApp, } from '@/lib/store'
import { firstName } from '@/lib/format'

export default function PhotoStep() {
  const router = useRouter()
  const profile = useApp((s) => s.profile)
  const setProfile = useApp((s) => s.setProfile)
  return (
    <OnboardShell step={2} title={`Smile, ${firstName(profile?.name)}`} em="✨" sub="Add a photo for your profile. It makes your space feel like yours.">
      <PhotoCapture initial={profile?.photo} onDone={(photo) => { setProfile({ photo }); router.push('/onboarding/privacy') }} onSkip={() => router.push('/onboarding/privacy')} />
    </OnboardShell>
  )
}
