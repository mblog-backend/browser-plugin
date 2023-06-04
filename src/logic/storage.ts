import { useStorageLocal } from '~/composables/useStorageLocal'

export const url = useStorageLocal('url', '')
export const token = useStorageLocal('token', '')
