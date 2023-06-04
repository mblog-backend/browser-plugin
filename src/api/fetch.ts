import { createFetch } from '@vueuse/core'
import { createDiscreteApi } from 'naive-ui'
const { message } = createDiscreteApi(['message'])

export const useMyFetch = createFetch({
  options: {
    async beforeFetch({ options, url }) {
      const result = await browser.storage.sync.get(['url', 'token'])
      options.headers = {
        token: result.token,
      }
      url = `${result.url}${url}`
      return { options, url }
    },
    async afterFetch(ctx) {
      if (ctx.response.status !== 200 || ctx.data.code !== 0) {
        if (ctx.data.code === 3)
          message.error('请确认URL和TOKEN是否正确,逗号分隔,连接mblog失败了')

        return Promise.reject(new Error(ctx.data?.msg || '系统异常'))
      }

      return Promise.resolve({ data: ctx.data.data })
    },
  },
  fetchOptions: {
    mode: 'cors',
  },
})
