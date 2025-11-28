(function () {
  const emailInput = document.querySelector('input[placeholder="Enter your email or username"]')
  const passwordInput = document.querySelector('input[type="password"]')
  const loginBtn = document.getElementById('login-submit')
  if (!loginBtn) return

  const setLoading = (isLoading) => {
    loginBtn.disabled = isLoading
    loginBtn.style.opacity = isLoading ? '0.6' : '1'
  }

  loginBtn.addEventListener('click', async (e) => {
    e.preventDefault()
    const email = emailInput?.value?.trim()
    const password = passwordInput?.value?.trim()
    if (!email || !password) {
      alert('Please provide email and password')
      return
    }
    setLoading(true)
    try {
      const data = await Api.login({ identifier: email, password })
      console.log('Logged in', data)
      window.location.href = '/index.html'
    } catch (err) {
      console.error(err)
      const message = err?.body?.message || err.message || 'Login failed'
      // show inline error if possible
      let errEl = document.getElementById('login-error')
      if (!errEl) {
        errEl = document.createElement('p')
        errEl.id = 'login-error'
        errEl.className = 'mt-2 text-sm text-red-600'
        loginBtn.parentNode.insertBefore(errEl, loginBtn.nextSibling)
      }
      errEl.textContent = message
    } finally {
      setLoading(false)
    }
  })
})()
