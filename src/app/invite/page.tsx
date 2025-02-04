'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/app/utils/supabaseClient'

export default function InvitePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    async function validateInvite() {
      if (!token) {
        router.push('/')
        return
      }

      const { data: invite, error } = await supabase
        .from('invites')
        .select('*')
        .eq('token', token)
        .single()

      if (error || !invite) {
        router.push('/')
        return
      }

      // Successfully validated invite
      router.push('/')
    }

    validateInvite()
  }, [token, router])

  return <div>Redirecting...</div>
}