// app/not-found.tsx

import Link from 'next/link'
import { Loader2 } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin mb-4" />
      <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
      <Link
        href="/"
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Return Home
      </Link>
    </div>
  )
}