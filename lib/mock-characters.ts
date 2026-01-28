export interface Character {
  id: string
  title: string
  image: string
  description?: string
  compatibility?: number
  astro?: string
}

export const mockCharacters = {
  soulmate: {
    id: 'soulmate-1',
    title: 'Your Soulmate',
    image: '/avatars/soulmate-female.jpg',
    description: 'A harmonious partner who values balance and partnership (Libra Sun), brings emotional depth and nurturing (Cancer Moon), and offers dreamy empathy with intuitive sensitivity (Pisces Rising).',
    compatibility: 92,
    astro: 'Libra Sun, Cancer Moon, Pisces Rising',
  } as Character,

  miniMe: {
    id: 'mini-me-1',
    title: 'Mini Me',
    image: '/avatars/best-friend.jpg',
    description: 'Your AI reflection - a companion that embodies your personality and essence.',
  } as Character,

  futureFamily: {
    futureHusband: {
      id: 'future-husband-1',
      title: 'Future Husband',
      image: '/avatars/soulmate-male.jpg',
    } as Character,
    futureBaby: {
      id: 'future-baby-1',
      title: 'Future Baby',
      image: '/avatars/future-baby.jpg',
    } as Character,
    futureWife: {
      id: 'future-wife-1',
      title: 'Future Wife',
      image: '/avatars/soulmate-female.jpg',
    } as Character,
  },

  friends: {
    boyfriend: {
      id: 'boyfriend-1',
      title: 'Boyfriend',
      image: '/avatars/soulmate-male.jpg',
    } as Character,
    bestFriend: {
      id: 'best-friend-1',
      title: 'Best Friend',
      image: '/avatars/best-friend.jpg',
    } as Character,
    girlfriend: {
      id: 'girlfriend-1',
      title: 'Girlfriend',
      image: '/avatars/soulmate-female.jpg',
    } as Character,
  },

  companions: [
    {
      id: 'companion-1',
      title: 'Mysterious Stranger',
      image: '/avatars/soulmate-male.jpg',
    } as Character,
    {
      id: 'companion-2',
      title: 'Wise Mentor',
      image: '/avatars/best-friend.jpg',
    } as Character,
    {
      id: 'companion-3',
      title: 'Dream Guide',
      image: '/avatars/soulmate-female.jpg',
    } as Character,
  ],
}
