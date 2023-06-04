import type { ProtocolWithReturn } from 'webext-bridge'

declare module 'webext-bridge' {
  export interface ProtocolMap {
    // define message protocol types
    // see https://github.com/antfu/webext-bridge#type-safe-protocols
    'tab-prev': { title: string | undefined }
    'post-to-mblog': { content: string | undefined,url: string | undefined ,token: string | undefined  }
    'post-to-mblog-finished': { success:boolean  }
    'get-current-tab': ProtocolWithReturn<{ tabId: number }, { title?: string }>
  }
}
