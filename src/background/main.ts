import { onMessage, sendMessage } from 'webext-bridge/background'

// only on dev mode
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import('/@vite/client')
  // load latest content script
  import('./contentScriptHMR')
}

browser.runtime.onInstalled.addListener((): void => {
  // eslint-disable-next-line no-console
  console.log('Extension installed')
})

browser.contextMenus.create({
  id: 'send2mblog',
  type: 'normal',
  title: '发送到mblog',
  contexts: ['selection'],
})

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'send2mblog')
    sendMessage('send-to-mblog', { title: tab?.title }, `content-script@${tab?.id}`)
})
const previousTabId = 0

onMessage('post-to-mblog', async ({ data }) => {
  if (!data.url && !data.token)
    return

  const result = await fetch(`${data.url}/api/user/current`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'token': data.token!,
    },
  })
  const json = await result.json()
  console.log(json, 'jsonjson')

  const visibility = json.data.defaultVisibility

  fetch(`${data.url}/api/memo/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'token': data.token!,
    },
    body: JSON.stringify({
      content: data.content,
      visibility: visibility || 'PRIVATE',
    }),
  }).then(res => res.json()).then(async (res) => {
    if (res.code === 0) {
      browser.notifications.create('send2mblogId', {
        type: 'basic',
        message: '发送到mblog成功了！',
        title: 'mblog插件通知',
        iconUrl: '../../assets/icon-512.png',
      })
    }
  })

  // const { error, data } = await useMyFetch('/api/memo/save').post({
  //   content: msg.data.content,
  // }).json()
  // console.log('error:', error, 'data', data)
  // if (!error.value)
  //   console.log('发送成功了！！！！')
  // browser.notifications.create('send2mblogId', {
  //   type: 'basic',
  //   message: '发送到mblog成功了！',
  //   title: 'mblog插件通知',
  // })
})

// communication example: send previous tab title from background page
// see shim.d.ts for type declaration
// browser.tabs.onActivated.addListener(async ({ tabId }) => {
//   if (!previousTabId) {
//     previousTabId = tabId
//     return
//   }

//   let tab: Tabs.Tab

//   try {
//     tab = await browser.tabs.get(previousTabId)
//     previousTabId = tabId
//   }
//   catch {
//     return
//   }

//   // eslint-disable-next-line no-console
//   console.log('previous tab', tab)
//   sendMessage('tab-prev', { title: tab.title }, { context: 'content-script', tabId })
// })

// onMessage('get-current-tab', async () => {
//   try {
//     const tab = await browser.tabs.get(previousTabId)
//     return {
//       title: tab?.title,
//     }
//   }
//   catch {
//     return {
//       title: undefined,
//     }
//   }
// })
