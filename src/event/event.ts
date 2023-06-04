import { useEventBus } from '@vueuse/core'

export const updateTokenBus = useEventBus<{}>('updateToken')
