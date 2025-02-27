'use client'

import PlayerNameForm from '../components/PlayerNameForm'

export default function TestPage() {
  const handleSubmit = (name: string) => {
    console.log('Name submitted:', name)
  }

  return <PlayerNameForm onSubmit={handleSubmit} />
}
