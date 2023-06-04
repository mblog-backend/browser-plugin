<script setup lang="ts">
import { createDiscreteApi } from 'naive-ui'
import { useMyFetch } from '~/api/fetch'
import { updateTokenBus } from '~/event/event'

const secret = ref('')
const connectSuccess = ref(false)
onMounted(() => {
  browser.storage.sync.get(['url', 'token', 'connectSuccess']).then((result) => {
    if (result.url && result.token)
      secret.value = `${result.url},${result.token}`

    if (result.connectSuccess === true)
      connectSuccess.value = true
  })
})

const { message } = createDiscreteApi(['message'])

const save = () => {
  const url = secret.value.split(',')[0]
  const token = secret.value.split(',')[1]

  browser.storage.sync.set({
    url, token,
  }).then(async () => {
    const { error } = await useMyFetch('/api/tag/list').post().json()
    if (!error.value) {
      message.success('连接mblog成功,可以发文了')
      browser.storage.sync.set({
        connectSuccess: true,
      })
      connectSuccess.value = true
      updateTokenBus.emit({})
    }
    else {
      message.error('连接mblog失败,请检查配置项是否填对.')
      browser.storage.sync.clear()
    }
  })
}
</script>

<template>
  <NConfigProvider>
    <main class="w-[600px] h-[320px] px-4 py-5 text-center text-gray-700">
      <div v-if="!connectSuccess" class="flex mb-4 gap-2 text-left">
        <NInput v-model:value="secret" type="text" placeholder="输入你的mblog地址和开发者token,逗号分隔" />
        <n-button type="primary" @click="save()">
          连接mblog
        </n-button>
      </div>
      <div v-else class=" flex flex-row text-gray-5 justify-end gap-2 text-xs items-center">
        <div class="text-green-4">
          连接Mblog成功
        </div>
        <n-button type="tertiary" size="small" @click="connectSuccess = false">
          更换秘钥
        </n-button>
      </div>
      <MemoInput :connect-success="connectSuccess" />
    </main>
  </NConfigProvider>
</template>
