(function () {
  const DASHBOARD_PATH = '/index.html'
  const LOGIN_PATH = '/login.html'
  const PUBLIC_PATHS = [LOGIN_PATH, '/legistration.html', '/registration.html']
  const INACTIVITY_LIMIT = 30 * 60 * 1000
  const activityEvents = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart']
  let inactivityTimer = null
  let activityBound = false

  const currentPath = () => {
    if (typeof window === 'undefined') return ''
    return window.location.pathname || '/'
  }

  const pathMatches = (target) => {
    if (!target) return false
    const normalized = target.startsWith('/') ? target : `/${target}`
    const path = currentPath()
    if (!path) return false
    return path === normalized || path.endsWith(normalized)
  }

  const isPublicPage = () => PUBLIC_PATHS.some((path) => pathMatches(path))

  const redirectTo = (target) => {
    if (typeof window === 'undefined') return
    if (pathMatches(target)) return
    window.location.href = target
  }

  const setFieldValue = (selector, value) => {
    document.querySelectorAll(selector).forEach((el) => {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
        el.value = value ?? ''
      } else {
        el.textContent = value ?? ''
      }
    })
  }

  const ensureLogoutButton = (afterNode) => {
    if (!afterNode || afterNode.dataset.logoutInjected) return
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.textContent = 'Log out'
    btn.className =
      'ml-2 px-3 py-2 rounded-lg bg-primary/90 text-white text-sm font-semibold hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary/40'
    btn.addEventListener('click', () => {
      Api.logout()
      window.location.href = '/login.html'
    })
    afterNode.insertAdjacentElement('afterend', btn)
    afterNode.dataset.logoutInjected = 'true'
  }

  const renderLoggedIn = (profile) => {
    if (!profile) return
    document.documentElement.dataset.auth = 'true'
    const label = profile.name || profile.email || 'Profile'

    document.querySelectorAll('a[href="userprofile.html"]').forEach((el) => {
      if (!el) return
      el.textContent = label
    })

    document.querySelectorAll('a[href="login.html"]').forEach((el) => {
      if (!el) return
      el.href = '/userprofile.html'
      el.textContent = label
      ensureLogoutButton(el)
    })

    setFieldValue('[data-profile-name]', profile.name || '')
    setFieldValue('[data-profile-email]', profile.email || '')
    startInactivityTimer()
    if (isPublicPage()) redirectTo(DASHBOARD_PATH)
  }

  const renderLoggedOut = () => {
    document.documentElement.dataset.auth = 'false'
    stopInactivityTimer()
    if (!isPublicPage()) redirectTo(LOGIN_PATH)
  }

  function startInactivityTimer() {
    if (typeof window === 'undefined') return
    if (!activityBound) {
      activityEvents.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }))
      activityBound = true
    }
    resetInactivityTimer()
  }

  function stopInactivityTimer() {
    clearTimeout(inactivityTimer)
    if (activityBound) {
      activityEvents.forEach((event) => window.removeEventListener(event, handleActivity))
      activityBound = false
    }
  }

  function handleActivity() {
    if (document.documentElement.dataset.auth !== 'true') return
    resetInactivityTimer()
  }

  function resetInactivityTimer() {
    clearTimeout(inactivityTimer)
    inactivityTimer = setTimeout(triggerAutoLogout, INACTIVITY_LIMIT)
  }

  async function triggerAutoLogout() {
    stopInactivityTimer()
    try {
      await Api.logout()
    } catch (_) {
      // ignore
    } finally {
      alert('You were logged out due to inactivity.')
      window.location.href = '/login.html'
    }
  }

  async function init() {
    try {
      const profile = await Api.me()
      if (!profile) {
        renderLoggedOut()
        return
      }
      renderLoggedIn(profile)
    } catch (_) {
      renderLoggedOut()
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()
