/* eslint-disable no-console */
import { onMessage, sendMessage } from 'webext-bridge/content-script'
// import App from './views/App.vue'

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
(() => {
  // console.info('[vitesse-webext] Hello world from content script')

  // communication example: send previous tab title from background page
  // onMessage('tab-prev', ({ data }) => {
  //   console.log(`[vitesse-webext] Navigate from page "${data.title}"`)
  // })
  // onMessage('post-to-mblog-finished', ({ data }) => {

  // })

  onMessage('send-to-mblog', async ({ data }) => {
    const content = window?.getSelection()?.toString()
    if (content != null && content.trim() !== '') {
      console.log('send-to-mblog', content)
      browser.storage.sync.get(['url', 'token', 'connectSuccess']).then((result) => {
        sendMessage('post-to-mblog', { content, url: result.url, token: result.token, edit: data?.edit }, 'background')
      })
    }
  })

  // mount component to context window
  // const container = document.createElement('div')
  // container.id = __NAME__
  // const root = document.createElement('div')
  // const styleEl = document.createElement('link')
  // const shadowDOM = container.attachShadow?.({ mode: __DEV__ ? 'open' : 'closed' }) || container
  // styleEl.setAttribute('rel', 'stylesheet')
  // styleEl.setAttribute('href', browser.runtime.getURL('dist/contentScripts/style.css'))
  // shadowDOM.appendChild(styleEl)
  // shadowDOM.appendChild(root)
  // document.body.appendChild(container)
  // const app = createApp(App)
  // setupApp(app)
  // app.mount(root)
})()
