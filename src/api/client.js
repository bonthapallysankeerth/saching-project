import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
})

export async function analyzeRevisions(formData) {
  const { data } = await api.post('/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function runDemo() {
  const formData = new FormData()
  formData.append('demo', 'true')
  const { data } = await api.post('/analyze', formData)
  return data
}

export default api
