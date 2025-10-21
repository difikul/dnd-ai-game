<template>
  <div :class="containerClass">
    <div :class="bubbleClass">
      <!-- Role indicator -->
      <div class="text-xs font-semibold mb-2 opacity-70">
        {{ roleLabel }}
      </div>

      <!-- Message content with formatted dice rolls and skill checks -->
      <div
        class="text-base whitespace-pre-wrap leading-relaxed break-words"
        style="word-wrap: break-word; overflow-wrap: anywhere;"
        v-html="formattedContent"
      />

      <!-- Metadata: Dice Rolls -->
      <div v-if="message.metadata?.diceRolls" class="mt-4 space-y-2">
        <div
          v-for="(roll, index) in message.metadata.diceRolls"
          :key="index"
          class="text-sm font-mono bg-dark-900 bg-opacity-50 px-3 py-2 rounded break-words"
        >
          <span class="text-primary-400">🎲 {{ roll.notation }}</span>
          <span class="mx-2">=</span>
          <span class="text-white font-bold">{{ roll.result }}</span>
          <span v-if="roll.rolls.length > 0" class="text-gray-400 ml-2">
            ({{ roll.rolls.join(' + ') }}{{ roll.modifier ? ` + ${roll.modifier}` : '' }})
          </span>
        </div>
      </div>

      <!-- Metadata: Skill Check -->
      <div v-if="message.metadata?.skillCheck" class="mt-4">
        <div
          class="text-sm font-mono px-3 py-2 rounded break-words"
          :class="message.metadata.skillCheck.success ? 'bg-green-900 bg-opacity-30 text-green-400' : 'bg-red-900 bg-opacity-30 text-red-400'"
        >
          <span class="font-semibold">{{ message.metadata.skillCheck.skill }}</span>
          <span class="mx-2">DC {{ message.metadata.skillCheck.dc }}</span>
          <span class="font-bold">
            {{ message.metadata.skillCheck.success ? '✓ Úspěch' : '✗ Neúspěch' }}
          </span>
          <span class="text-gray-400 ml-2">
            ({{ message.metadata.skillCheck.result }})
          </span>
        </div>
      </div>

      <!-- Timestamp -->
      <div class="text-xs opacity-50 mt-3">
        {{ formatTime(message.createdAt) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Message } from '@/types/game'

interface Props {
  message: Message
}

const props = defineProps<Props>()

const containerClass = computed(() => {
  if (props.message.role === 'player') {
    return 'flex justify-end'
  } else if (props.message.role === 'narrator') {
    return 'flex justify-start'
  } else {
    return 'flex justify-center'
  }
})

const bubbleClass = computed(() => {
  const base = 'max-w-3xl px-5 py-4 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl break-words overflow-wrap-anywhere'

  if (props.message.role === 'player') {
    return `${base} bg-primary-600 text-white`
  } else if (props.message.role === 'narrator') {
    return `${base} bg-dark-800 text-gray-200 border border-dark-700`
  } else {
    return `${base} bg-dark-700 text-gray-400 italic text-sm`
  }
})

const roleLabel = computed(() => {
  const labels = {
    player: 'Ty',
    narrator: '🎲 Vypravěč',
    system: '⚙️ Systém',
  }
  return labels[props.message.role]
})

const formattedContent = computed(() => {
  let content = props.message.content

  // Parse [DICE: 1d20+5] patterns and format them
  content = content.replace(
    /\[DICE:\s*([^\]]+)\]/g,
    '<span class="inline-block font-mono bg-dark-900 bg-opacity-70 px-2 py-1 rounded text-primary-400 mx-1">🎲 $1</span>'
  )

  // Parse [SKILL: Perception] patterns
  content = content.replace(
    /\[SKILL:\s*([^\]]+)\]/g,
    '<span class="inline-block font-semibold text-blue-400 mx-1">$1</span>'
  )

  // Parse [NPC: Name] patterns
  content = content.replace(
    /\[NPC:\s*([^\]]+)\]/g,
    '<span class="inline-block font-semibold text-purple-400 mx-1">$1</span>'
  )

  // Parse [LOCATION: Place] patterns
  content = content.replace(
    /\[LOCATION:\s*([^\]]+)\]/g,
    '<span class="inline-block font-semibold text-green-400 mx-1">📍 $1</span>'
  )

  // Parse **bold** markdown
  content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

  // Parse *italic* markdown
  content = content.replace(/\*([^*]+)\*/g, '<em>$1</em>')

  return content
})

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped>
/* Additional styling for formatted content */
:deep(strong) {
  @apply font-bold text-white;
}

:deep(em) {
  @apply italic;
}
</style>
