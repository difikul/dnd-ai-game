import { faker } from '@faker-js/faker'
import { Character } from '@prisma/client'

export const mockCharacter = (): Partial<Character> => ({
  name: faker.person.firstName(),
  race: 'Human',
  class: 'Fighter',
  level: 1,
  strength: 15,
  dexterity: 14,
  constitution: 13,
  intelligence: 12,
  wisdom: 10,
  charisma: 8,
  hitPoints: 13,
  maxHitPoints: 13,
  armorClass: 12,
  experience: 0
})

export const mockDwarf = (): Partial<Character> => ({
  ...mockCharacter(),
  race: 'Dwarf',
  constitution: 15 // +2 racial bonus
})

export const mockWizard = (): Partial<Character> => ({
  ...mockCharacter(),
  class: 'Wizard',
  intelligence: 15,
  hitPoints: 8,
  maxHitPoints: 8
})

export const mockRogue = (): Partial<Character> => ({
  ...mockCharacter(),
  class: 'Rogue',
  dexterity: 16,
  hitPoints: 10,
  maxHitPoints: 10,
  armorClass: 14
})

export const mockCleric = (): Partial<Character> => ({
  ...mockCharacter(),
  class: 'Cleric',
  wisdom: 15,
  hitPoints: 10,
  maxHitPoints: 10,
  armorClass: 16
})

export const mockHighLevelCharacter = (): Partial<Character> => ({
  ...mockCharacter(),
  level: 10,
  strength: 18,
  dexterity: 16,
  constitution: 16,
  intelligence: 14,
  wisdom: 12,
  charisma: 10,
  hitPoints: 90,
  maxHitPoints: 90,
  armorClass: 18,
  experience: 48000
})
