<script setup lang="ts">
import { useStorage } from '@vueuse/core'
import { type MentionOption, type UploadCustomRequestOptions, type UploadInst, createDiscreteApi } from 'naive-ui'
import { type MemoSaveParam, getVisbilitys } from '~/types/memo'
import { type Tag } from '~/types/tag'
import 'emoji-picker-element'
import { useMyFetch } from '~/api/fetch'
import { updateTokenBus } from '~/event/event'

const props = defineProps<{
  connectSuccess: boolean
}>()
const tags = ref<Array<MentionOption>>()
const memoSaveParam: MemoSaveParam = reactive({
  visibility: 'PUBLIC',
  publicIds: [],
})

interface UploadItem {
  url: string
  publicId: string
  suffix: string
  storageType: string
  fileType: string
  fileName: string
}

const disbaled = ref(false)
const fcRef = ref<HTMLElement | null>(null)

const uploadRef = ref<UploadInst | null>(null)

const uploadFiles = ref<Array<UploadItem>>([])

const emojiShow = ref(false)

const visibilityOptions = getVisbilitys()

const edited = ref(false)
const userinfo = useStorage('userinfo', { token: '', defaultVisibility: 'PUBLIC', defaultEnableComment: 'false' })

updateTokenBus.on(() => {
  disbaled.value = false
})

onMounted(async () => {
  if (!props.connectSuccess)
    disbaled.value = true

  memoSaveParam.visibility = userinfo.value.defaultVisibility || 'PUBLIC'
  memoSaveParam.enableComment = userinfo.value.defaultEnableComment === 'true' ? '1' : '0'
  const { data, error } = await useMyFetch('/api/tag/list').post().json()
  if (error.value)
    return
  const tagList = data.value as Array<Tag>
  tags.value = tagList.map((r) => {
    return {
      label: r.name.substring(1),
      value: r.name.substring(1),
    }
  })
})
const { message } = createDiscreteApi(['message'])

const appendValue = (content: string) => {
  if (memoSaveParam.content)
    memoSaveParam.content = `${memoSaveParam.content}\n`
  else
    memoSaveParam.content = ''

  memoSaveParam.content = memoSaveParam.content + content
  const textArea = document.querySelector('textarea') as HTMLTextAreaElement
  textArea.focus()
}

const emojiClicked = async (event: { detail: any }) => {
  const textArea = document.querySelector('textarea') as HTMLTextAreaElement
  const emojiVal = event.detail.unicode
  if (textArea.selectionStart || textArea.selectionStart === 0) {
    const startPos = textArea.selectionStart
    const endPos = textArea.selectionEnd
    memoSaveParam.content
        = textArea.value.substring(0, startPos) + emojiVal + textArea.value.substring(endPos, textArea.value.length)
    await nextTick()
    textArea.focus()
    textArea.setSelectionRange(endPos + emojiVal.length, endPos + emojiVal.length)
  }
  else {
    memoSaveParam.content += ` ${emojiVal} `
  }
  emojiShow.value = false
}

const exitEdit = () => {
  memoSaveParam.visibility = userinfo.value.defaultVisibility || 'PUBLIC'
  memoSaveParam.enableComment = userinfo.value.defaultEnableComment === 'true' ? '1' : '0'
  memoSaveParam.publicIds = []
  memoSaveParam.priority = 0
  memoSaveParam.deleteMemo = false
  memoSaveParam.content = ''
  memoSaveParam.id = undefined
  uploadFiles.value = []
  edited.value = false
}

const saveMemo = async () => {
  disbaled.value = true
  window.setTimeout(() => {
    disbaled.value = false
  }, 3000)
  const { connectSuccess } = await browser.storage.sync.get(['connectSuccess'])
  if (!connectSuccess)
    message.warning('请先连接MBlog')

  const saveUrl = memoSaveParam.id ? '/api/memo/update' : '/api/memo/save'
  memoSaveParam.enableComment = parseInt(memoSaveParam.enableComment as any)
  const { error } = await useMyFetch(saveUrl).post(memoSaveParam).json()
  if (!error.value) {
    exitEdit()
    message.success('记录成功！')
  }
}

const upload = async (file: File) => {
  const uploadUrl = '/api/resource/upload'
  const uploadHeaders = {
    token: userinfo.value.token,
  }
  const formData = new FormData()
  formData.append('files', file)

  const { data, error } = await useMyFetch(uploadUrl, {
    body: formData,
    headers: uploadHeaders,
  })
    .post()
    .json()
  if (!error.value) {
    const result = await browser.storage.sync.get(['url'])

    data.value.forEach((item: any) => {
      if (item.storageType === 'LOCAL')
        item.url = result.url + item.url
    })
    uploadFiles.value.push(...data.value)
    memoSaveParam.publicIds = uploadFiles.value.map(r => r.publicId)
    uploadRef.value?.clear()
  }
}

const paste = async (e: any) => {
  if (e.clipboardData.files[0])
    await upload(e.clipboardData.files[0])
}

const customRequest = async ({ file }: UploadCustomRequestOptions) => {
  await upload(file.file as File)
}

const deleteResource = (publicId: string) => {
  const idx = uploadFiles.value.findIndex(r => r.publicId === publicId)
  if (idx >= 0)
    uploadFiles.value.splice(idx, 1)

  const idx2 = memoSaveParam.publicIds?.findIndex(r => r === publicId)
  if (memoSaveParam.publicIds && idx2 != null && idx2 >= 0)
    memoSaveParam.publicIds.splice(idx2, 1)
}
</script>

<template>
  <div ref="fcRef" class="p-2 bg-white rd fc gap-2 sticky top-0 shadow-xl z-99 dark:bg-gray-7 mb-2 text-left">
    <div class="flex flex-row items-center gap-2 text-lg text-gray-5 mb-2">
      <div
        class="i-carbon:list hover:text-gray-9 cursor-pointer"
        title="有序列表"
        @click="appendValue('1. \n2. \n3. ')"
      />
      <div
        class="i-carbon:menu hover:text-gray-9 cursor-pointer"
        title="无序列表"
        @click="appendValue('- \n- \n- ')"
      />
      <div
        class="i-carbon:link hover:text-gray-9 cursor-pointer"
        title="链接"
        @click="appendValue('[描述](链接)')"
      />
      <div
        class="i-carbon:image hover:text-gray-9 cursor-pointer"
        title="图片"
        @click="appendValue('![描述](链接)')"
      />
      <div
        class="i-carbon:task hover:text-gray-9 cursor-pointer"
        title="待办"
        @click="appendValue('- [ ] \n- [ ] \n- [ ] \n')"
      />
      <div
        class="i-carbon:data-table hover:text-gray-9 cursor-pointer"
        title="表格"
        @click="appendValue('|column1|column2|column3|\n|-|-|-|\n|content1|content2|content3|')"
      />
      <div class="i-carbon:code hover:text-gray-9 cursor-pointer" title="代码" @click="appendValue('```\n\n```')" />
      <div
        class="i-carbon:not-available hover:text-gray-9 cursor-pointer"
        title="分割线"
        @click="appendValue('\n-------------------\n')"
      />
      <div class="i-carbon:quotes hover:text-gray-9 cursor-pointer" title="引用" @click="appendValue('> ')" />
    </div>

    <n-mention
      v-if="tags && tags.length > 0"
      v-model:value="memoSaveParam.content"
      type="textarea"
      placeholder="输入你要记录的吧,第一行以`#`开头的会被视为标签"
      show-count
      prefix="#"
      :options="tags"
      :autosize="{
        minRows: 5,
        maxRows: 20,
      }"
      @paste="paste"
    />
    <n-input
      v-else
      v-model:value="memoSaveParam.content"
      type="textarea"
      placeholder="输入你要记录的吧,第一行以`#`开头的会被视为标签"
      show-count
      :autosize="{
        minRows: 5,
        maxRows: 20,
      }"
      @paste="paste"
    />
    <div class="flex flex-row gap-2 items-center mt-2">
      <n-select v-model:value="memoSaveParam.visibility" :options="visibilityOptions" class="w-32" size="small" />
      <n-upload ref="uploadRef" :multiple="true" name="files" :show-file-list="false" :custom-request="customRequest">
        <div
          class="i-carbon:cloud-upload cursor-pointer text-gray-500 hover:text-gray text-lg dark:text-yellow-3"
        />
      </n-upload>
      <n-popover :show="emojiShow" @clickoutside="emojiShow = false">
        <template #trigger>
          <div
            class="i-carbon:face-wink cursor-pointer hover:text-yellow text-lg dark:text-yellow-3"
            @click="emojiShow = true"
          />
        </template>
        <emoji-picker ref="pickerRef" @emoji-click="emojiClicked" />
      </n-popover>

      <n-switch
        v-model:value="memoSaveParam.enableComment"
        size="small"
        checked-value="1"
        unchecked-value="0"
      >
        <template #checked>
          允许评论
        </template>
        <template #unchecked>
          禁止评论
        </template>
      </n-switch>
      <div class="ml-auto gap-2 fr items-center">
        <n-button type="primary" class="px-8" :disabled="disbaled" @click="saveMemo">
          记录
        </n-button>
      </div>
    </div>

    <div v-if="uploadFiles" class="flex flex-row mt-2">
      <n-image-group>
        <n-space>
          <div v-for="(img, index) in uploadFiles" :key="index" class="relative">
            <n-image
              v-if="img.fileType.includes('image')"
              width="100"
              height="100"
              lazy
              class="rd hover:shadow-2xl"
              :src="img.url + (img.fileType.includes('webp') ? '' : img.suffix || '')"
              :fallback-src="img.url"
              :preview-src="img.url"
              :intersection-observer-options="{
                root: '#image-scroll-container',
              }"
            >
              <template #placeholder>
                <div
                  style="
                      width: 100px;
                      height: 100px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      background-color: #0001;
                    "
                >
                  Loading
                </div>
              </template>
            </n-image>
            <div v-else>
              {{ img.fileName }}
            </div>
            <div class="deleteBtn" @click="deleteResource(img.publicId)" />
          </div>
        </n-space>
      </n-image-group>
    </div>
  </div>
</template>

  <style scoped lang="scss">
  ::v-deep(.n-upload) {
    width: auto;
    display: flex;
  }

  .deleteBtn {
    @apply i-carbon:close-filled text-red-700 hover:text-red-400 cursor-pointer absolute top-0 right--2 fw-500 z-99;
  }

  emoji-picker {
    width: 400px;
    height: 300px;
  }
  @media screen and (max-width: 640px) {
    emoji-picker {
      width: 100%;
      --num-columns: 6;
      --category-emoji-size: 1rem;
    }
  }
  </style>
