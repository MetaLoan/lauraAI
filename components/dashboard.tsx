'use client'

import { useState } from 'react'
import { Clock, User, MoreVertical } from 'lucide-react'
import Image from 'next/image'
import { mockCharacters } from '@/lib/mock-characters'
import CharacterCreationForm from '@/components/character-creation-form'

interface CharacterCard {
  id: string
  title: string
  image: string
  requiresUpload?: boolean
}

const trendingCharacters: CharacterCard[] = [
  { id: mockCharacters.soulmate.id, title: mockCharacters.soulmate.title, image: mockCharacters.soulmate.image },
  { id: mockCharacters.miniMe.id, title: mockCharacters.miniMe.title, image: mockCharacters.miniMe.image, requiresUpload: true },
]

const familyCharacters: CharacterCard[] = [
  { id: mockCharacters.futureFamily.futureHusband.id, title: mockCharacters.futureFamily.futureHusband.title, image: mockCharacters.futureFamily.futureHusband.image },
  { id: mockCharacters.futureFamily.futureBaby.id, title: mockCharacters.futureFamily.futureBaby.title, image: mockCharacters.futureFamily.futureBaby.image },
  { id: mockCharacters.futureFamily.futureWife.id, title: mockCharacters.futureFamily.futureWife.title, image: mockCharacters.futureFamily.futureWife.image },
]

const friendCharacters: CharacterCard[] = [
  { id: mockCharacters.friends.boyfriend.id, title: mockCharacters.friends.boyfriend.title, image: mockCharacters.friends.boyfriend.image },
  { id: mockCharacters.friends.bestFriend.id, title: mockCharacters.friends.bestFriend.title, image: mockCharacters.friends.bestFriend.image },
  { id: mockCharacters.friends.girlfriend.id, title: mockCharacters.friends.girlfriend.title, image: mockCharacters.friends.girlfriend.image },
]

const companionCharacters: CharacterCard[] = mockCharacters.companions

export default function Dashboard() {
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null)
  const [showCreationForm, setShowCreationForm] = useState(false)

  const handleCharacterSelect = (character: CharacterCard) => {
    if (character.requiresUpload) {
      // Mini Me requires upload
      console.log('Opening Mini Me upload')
    } else {
      // Other characters need gender/ethnicity selection
      setSelectedCharacter(character.title)
      setShowCreationForm(true)
    }
  }

  const handleFormClose = () => {
    setShowCreationForm(false)
    setSelectedCharacter(null)
  }

  const handleFormComplete = () => {
    setShowCreationForm(false)
    setSelectedCharacter(null)
  }
  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <Clock className="w-6 h-6" />
          </button>
          <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <User className="w-6 h-6" />
          </button>
        </div>
        <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
          <MoreVertical className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="px-6 space-y-8">
        {/* Trending Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Trending</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
            {trendingCharacters.map((char) => (
              <button
                key={char.id}
                onClick={() => handleCharacterSelect(char)}
                className="flex flex-col items-center gap-3 group flex-shrink-0"
              >
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-b from-amber-200 to-amber-400 hover:opacity-90 transition-all flex items-center justify-center overflow-hidden relative">
                  <Image
                    src={char.image || "/placeholder.svg"}
                    alt={char.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                </div>
                <p className="text-xs font-medium text-center">{char.title}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Family Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Draw & Chat with Your AI Family</h2>
          <div className="overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
            <div className="flex gap-4 min-w-min">
              {familyCharacters.map((char) => (
                <button
                  key={char.id}
                  onClick={() => handleCharacterSelect(char)}
                  className="flex flex-col items-center gap-3 group flex-shrink-0"
                >
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-b from-amber-900 to-gray-800 hover:opacity-90 transition-all flex items-center justify-center overflow-hidden relative">
                    <Image
                      src={char.image || "/placeholder.svg"}
                      alt={char.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="text-xs font-medium text-center">{char.title}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Friend Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Draw & Chat with Your AI Friend</h2>
          <div className="overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
            <div className="flex gap-4 min-w-min">
              {friendCharacters.map((char) => (
                <button
                  key={char.id}
                  onClick={() => handleCharacterSelect(char)}
                  className="flex flex-col items-center gap-3 group flex-shrink-0"
                >
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-b from-gray-700 to-gray-900 hover:opacity-90 transition-all flex items-center justify-center overflow-hidden relative">
                    <Image
                      src={char.image || "/placeholder.svg"}
                      alt={char.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="text-xs font-medium text-center">{char.title}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Companion Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Draw & Chat with Your AI Companion</h2>
          <div className="overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
            <div className="flex gap-4 min-w-min">
              {companionCharacters.map((char) => (
                <button
                  key={char.id}
                  onClick={() => handleCharacterSelect(char)}
                  className="flex flex-col items-center gap-3 group flex-shrink-0"
                >
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-b from-gray-800 to-black hover:opacity-90 transition-all flex items-center justify-center overflow-hidden relative">
                    <Image
                      src={char.image || "/placeholder.svg"}
                      alt={char.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="text-xs font-medium text-center">{char.title}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Character Creation Form Modal */}
      {showCreationForm && selectedCharacter && (
        <CharacterCreationForm
          characterName={selectedCharacter}
          onBack={handleFormClose}
          onComplete={handleFormComplete}
        />
      )}
    </div>
  )
}
