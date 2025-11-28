// Minimal client-side API helper for NutriAI backend
// Exposes a global `Api` object for simple pages.
(function (win) {
  const API_BASE = 'https://wpback.boramae.dev/api'

  const getHeaders = () => {
    const headers = { Accept: 'application/json' }
    const token = getToken()
    if (token) headers['Authorization'] = 'Bearer ' + token
    return headers
  }

  function setToken(token) {
    if (token) localStorage.setItem('nutri_token', token)
    else localStorage.removeItem('nutri_token')
  }

  function getToken() {
    return localStorage.getItem('nutri_token')
  }

  async function request(path, opts = {}) {
    const headers = { ...getHeaders(), ...(opts.headers || {}) }
    if (opts.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json'

    const res = await fetch(API_BASE + path, {
      credentials: 'include',
      ...opts,
      headers,
      body: opts.body && typeof opts.body !== 'string' ? JSON.stringify(opts.body) : opts.body,
    })

    const contentType = res.headers.get('content-type') || ''
    const body = contentType.includes('application/json') ? await res.json().catch(() => null) : await res.text().catch(() => null)
    if (res.status === 401) {
      // unauthorized — clear token and redirect to login (except on public pages)
      setToken(null)
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname || ''
        const publicPaths = ['/login.html', '/legistration.html', '/registration.html', '/']
        const onPublicPage = publicPaths.some(path => currentPath.endsWith(path))
        if (!onPublicPage) {
          window.location.href = '/login.html'
        }
      }
      const err401 = new Error('Unauthorized')
      err401.status = 401
      err401.body = body
      throw err401
    }
    if (!res.ok) {
      const err = new Error('Request failed')
      err.status = res.status
      err.body = body
      throw err
    }
    return body
  }

  function unwrap(body, key, fallback) {
    if (!body) return fallback
    if (key && body[key] !== undefined) return body[key]
    return body ?? fallback
  }

  // Auth
  async function login({ identifier, email, password }) {
    const userIdentifier = identifier || email
    const data = await request('/auth/login', { method: 'POST', body: { identifier: userIdentifier, password } })
    if (data?.token) setToken(data.token)
    return data
  }

  async function register(body) {
    const data = await request('/auth/register', { method: 'POST', body })
    if (data?.token) setToken(data.token)
    return data
  }

  async function me() {
    const res = await request('/auth/me')
    return unwrap(res, 'user', null)
  }

  async function checkEmail(email) {
    if (!email) return false
    const res = await request(`/auth/check-email?email=${encodeURIComponent(email)}`)
    return !!res?.exists
  }

  // Recommendations
  async function createRecommendation(body) {
    return request('/recommendations', { method: 'POST', body })
  }

  async function updateRecommendation(id, body) {
    if (!id) throw new Error('Recommendation id is required')
    const res = await request(`/recommendations/${id}`, { method: 'PATCH', body })
    return unwrap(res, 'recommendation', null)
  }

  async function deleteRecommendation(id) {
    if (!id) throw new Error('Recommendation id is required')
    await request(`/recommendations/${id}`, { method: 'DELETE' })
  }

  async function listRecommendations(query = '') {
    const q = query ? `?${query}` : ''
    const res = await request('/recommendations' + q)
    return unwrap(res, 'recommendations', [])
  }

  async function createManualPlanEntry(body) {
    const res = await request('/recommendations/manual', { method: 'POST', body })
    return unwrap(res, 'recommendation', null)
  }

  // Feedback
  async function submitFeedback(body) {
    const res = await request('/feedback', { method: 'POST', body })
    return unwrap(res, 'feedback', null)
  }

  async function listFeedback(limit = 20) {
    const res = await request(`/feedback?limit=${limit}`)
    return unwrap(res, 'feedback', [])
  }

  // Meals
  async function getMeal(id) {
    if (!id) return null
    const res = await request(`/meals/${id}`)
    return unwrap(res, 'meal', null)
  }

  async function getMeals(query = '') {
    const q = query ? `?${query}` : ''
    const res = await request('/meals' + q)
    return unwrap(res, 'meals', [])
  }

  // Nutrition
  async function upsertNutritionLog(body) {
    const res = await request('/nutrition/logs', { method: 'POST', body })
    return unwrap(res, 'log', null)
  }

  // Dashboard
  async function getDashboard() {
    return request('/dashboard')
  }

  // Profile
  async function getProfile() {
    const res = await request('/users/me')
    return unwrap(res, 'user', null)
  }

  async function updateProfile(body) {
    const res = await request('/users/me', { method: 'PATCH', body })
    return unwrap(res, 'user', null)
  }

  async function getPreferences() {
    const res = await request('/users/preferences')
    return unwrap(res, 'preferences', null)
  }

  async function updatePreferences(body) {
    const res = await request('/users/preferences', { method: 'PUT', body })
    return unwrap(res, 'preferences', null)
  }

  win.Api = {
    login,
    register,
    me,
    checkEmail,
    createRecommendation,
    createManualPlanEntry,
    updateRecommendation,
    deleteRecommendation,
    listRecommendations,
    submitFeedback,
    listFeedback,
    getMeal,
    getMeals,
    upsertNutritionLog,
    getDashboard,
    getProfile,
    updateProfile,
    getPreferences,
    updatePreferences,
    logout: () => setToken(null),
    _internal: { setToken, getToken },
  }
})(window);
