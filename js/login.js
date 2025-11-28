(function () {
  const emailInput = document.querySelector('input[placeholder="Enter your email or username"]')
  const passwordInput = document.getElementById('login-password')
  const loginBtn = document.getElementById('login-submit')
  const passwordToggle = document.getElementById('toggle-password')
  const passwordToggleIcon = passwordToggle?.querySelector('.material-symbols-outlined')
  if (!loginBtn) return

  if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener('click', () => {
      const isHidden = passwordInput.type === 'password'
      passwordInput.type = isHidden ? 'text' : 'password'
      if (passwordToggleIcon) passwordToggleIcon.textContent = isHidden ? 'visibility_off' : 'visibility'
      passwordInput.focus({ preventScroll: true })
    })
  }

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
