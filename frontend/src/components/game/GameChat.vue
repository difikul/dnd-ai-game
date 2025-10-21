<template>
  <div class="flex flex-col h-full bg-dark-900">
    <!-- Message List -->
    <div
      ref="messageContainer"
      class="flex-1 overflow-y-auto p-6 scroll-smooth"
    >
      <!-- Centered Container -->
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Empty State -->
        <div
          v-if="!hasMessages && !isTyping"
          class="flex items-center justify-center min-h-[400px] text-gray-500"
        >
          <div class="text-center">
            <div class="text-4xl mb-4">🎲</div>
            <p class="text-lg">Tvoje dobrodružství začíná...</p>
            <p class="text-sm mt-2 text-gray-600">Napiš, co chceš dělat</p>
          </div>
        </div>

        <!-- Message List -->
        <MessageBubble
          v-for="message in messages"
          :key="message.id"
          :message="message"
        />

        <!-- Typing Indicator -->
        <TypingIndicator v-if="isTyping" />
      </div>
    </div>

    <!-- Input Area -->
    <div class="border-t border-dark-700 p-6 bg-dark-800">
      <div class="max-w-4xl mx-auto">
        <form @submit.prevent="handleSend" class="space-y-3">
          <!-- Error Message -->
          <div
            v-if="error"
            class="text-red-500 text-sm bg-red-900 bg-opacity-20 px-3 py-2 rounded border border-red-800"
          >
            {{ error }}
          </div>

          <!-- Input Row -->
          <div class="flex gap-3">
            <input
              v-model="inputText"
              type="text"
              placeholder="Co chceš dělat?"
              :disabled="isLoading"
              class="flex-1 bg-dark-900 text-white px-4 py-3 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-primary-500
                     disabled:opacity-50 disabled:cursor-not-allowed
                     placeholder-gray-500 transition"
              @keydown.enter.exact.prevent="handleSend"
            />
            <button
              type="submit"
              :disabled="isLoading || !inputText.trim()"
              class="bg-primary-500 hover:bg-primary-600 text-white
                     px-6 py-3 rounded-lg font-semibold transition
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center gap-2 min-w-[100px] justify-center"
            >
              <span v-if="!isLoading">Odeslat</span>
              <span v-else>
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
            </button>
          </div>

          <!-- Helper Text -->
          <div class="text-xs text-gray-500 flex items-center justify-between">
            <span>Stiskni Enter pro odeslání</span>
            <span v-if="messageCount > 0">{{ messageCount }} zpráv</span>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import MessageBubble from './MessageBubble.vue'
import TypingIndicator from './TypingIndicator.vue'

const chatStore = useChatStore()
const messageContainer = ref<HTMLElement>()
const inputText = ref('')

// Computed properties
const messages = computed(() => chatStore.messages)
const isLoading = computed(() => chatStore.isLoading)
const isTyping = computed(() => chatStore.isTyping)
const error = computed(() => chatStore.error)
const hasMessages = computed(() => chatStore.hasMessages)
const messageCount = computed(() => chatStore.messageCount)

/**
 * Handle send message
 */
async function handleSend() {
  const text = inputText.value.trim()
  if (!text || isLoading.value) return

  try {
    await chatStore.sendMessage(text)
    inputText.value = ''
    await nextTick()
    scrollToBottom()
  } catch (err) {
    console.error('Failed to send message:', err)
  }
}

/**
 * Scroll to bottom of message container
 */
function scrollToBottom() {
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  }
}

// Auto-scroll on new messages
watch(
  messages,
  async () => {
    await nextTick()
    scrollToBottom()
  },
  { deep: true }
)

// Scroll to bottom on mount
onMounted(() => {
  scrollToBottom()
})
</script>

<style scoped>
/* Custom scrollbar for message container */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
