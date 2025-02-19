import { NextApiRequest, NextApiResponse } from 'next'
import { createInvite } from '@/app/actions/invite'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { groupId } = req.body
    if (!groupId) {
      return res.status(400).json({ error: 'groupId is required' })
    }
    const result = await createInvite(groupId)
    if (result.error) {
      return res.status(500).json({ error: result.error })
    }
    return res.status(200).json(result.data)
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}