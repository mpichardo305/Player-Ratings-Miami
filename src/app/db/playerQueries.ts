'use server'

import { createClient } from '@/app/utils/supabase/server'

export async function createInitialPlayer(playerId: string, phoneNumber: string | null, name?:string) {
  const supabase = createClient()
  return await supabase
    .from('players')
    .insert({
      status: 'pending',
      phone: phoneNumber,
      user_id: null,
      id: playerId,
      name: name
    })
    .select()
    .single()
}

export async function updatePlayerName(playerId: string, playerName: string, userId: string, phoneNumber: string) {
  const supabase = createClient()
  return await supabase
    .from('players')
    .update({ 
      name: playerName,
      user_id: userId,
      phone: phoneNumber, 
    })
    .eq('id', playerId)
    .select()
    .single()
}

export async function getPlayerByPhone(phone: string) {
  const supabase = createClient()
  return await supabase
    .from('players')
    .select('id, phone, name')
    .eq('phone', phone)
    .order('status', { ascending: true })
    .limit(1)
    .single()
}

