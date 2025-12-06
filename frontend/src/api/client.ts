/// <reference types="vite/client" />

// 開発環境・本番環境共に /api を使用（CloudFront経由で統一）
const API_BASE_URL: string = '/api'

console.log(`🚀 [${import.meta.env.DEV ? 'DEV' : 'PROD'}] API Base URL: ${API_BASE_URL}`)

export const apiClient = {
  async get(endpoint: string) {
    const url = `${API_BASE_URL}${endpoint}`
    console.log(`🌐 [${import.meta.env.DEV ? 'DEV' : 'PROD'}] GET: ${url}`)
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
    })
    
    console.log(`📡 [${import.meta.env.DEV ? 'DEV' : 'PROD'}] Response: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      console.error(`❌ GET ${url} failed:`, response.status, response.statusText)
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  },

  async post(endpoint: string, data: unknown) {
    const url = `${API_BASE_URL}${endpoint}`
    console.log(`🌐 [${import.meta.env.DEV ? 'DEV' : 'PROD'}] POST: ${url}`, data)
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify(data),
    })
    
    console.log(`📡 [${import.meta.env.DEV ? 'DEV' : 'PROD'}] Response: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      console.error(`❌ POST ${url} failed:`, response.status, response.statusText)
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  },

  async put(endpoint: string, data: unknown) {
    const url = `${API_BASE_URL}${endpoint}`
    console.log(`🌐 [${import.meta.env.DEV ? 'DEV' : 'PROD'}] PUT: ${url}`, data)
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify(data),
    })
    
    console.log(`📡 [${import.meta.env.DEV ? 'DEV' : 'PROD'}] Response: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      console.error(`❌ PUT ${url} failed:`, response.status, response.statusText)
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  },

  async delete(endpoint: string) {
    const url = `${API_BASE_URL}${endpoint}`
    console.log(`🌐 [${import.meta.env.DEV ? 'DEV' : 'PROD'}] DELETE: ${url}`)
    
    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'same-origin',
    })
    
    console.log(`📡 [${import.meta.env.DEV ? 'DEV' : 'PROD'}] Response: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      console.error(`❌ DELETE ${url} failed:`, response.status, response.statusText)
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  },

  async patch(endpoint: string, data: unknown) {
    const url = `${API_BASE_URL}${endpoint}`
    console.log(`🌐 [${import.meta.env.DEV ? 'DEV' : 'PROD'}] PATCH: ${url}`, data)
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify(data),
    })
    
    console.log(`📡 [${import.meta.env.DEV ? 'DEV' : 'PROD'}] Response: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      console.error(`❌ PATCH ${url} failed:`, response.status, response.statusText)
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  },
}
