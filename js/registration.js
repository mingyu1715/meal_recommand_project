(function () {
  const formStep1 = document.getElementById('formStep1')
  if (!formStep1) return

  const state = { step: 1, account: null }
  const stepLabel = document.getElementById('stepLabel')
  const percentLabel = document.getElementById('percentLabel')
  const progressBar = document.getElementById('progressBar')
  const step1Section = document.getElementById('step1')
  const step2Section = document.getElementById('step2')
  const finishBtn = document.getElementById('finishButton')
  const finishErrorEl = document.getElementById('finish-error')

  const submitBtn = formStep1.querySelector('button[type="submit"]') || formStep1.querySelector('button')
  const nameAllowed = /^[\p{L}\p{N}'\- ]+$/u

  const containsEmoji = (str) => {
    try {
      return /\p{Extended_Pictographic}/u.test(str)
    } catch (_) {
      return false
    }
  }

  const showError = (el, msg) => {
    if (!el) return
    el.setAttribute('aria-invalid', 'true')
    el.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-200')
    const msgEl = document.getElementById('err-' + el.id)
    if (msgEl) {
      msgEl.textContent = msg
      msgEl.classList.remove('hidden')
    }
  }

  const clearError = (el) => {
    if (!el) return
    el.removeAttribute('aria-invalid')
    el.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-200')
    const msgEl = document.getElementById('err-' + el.id)
    if (msgEl) {
      msgEl.textContent = ''
      msgEl.classList.add('hidden')
    }
  }

  const validateStep1 = () => {
    const nameEl = document.getElementById('nick-name')
    const emailEl = document.getElementById('email')
    const pwEl = document.getElementById('password')
    const pwReEl = document.getElementById('password-re')
    const ageEl = document.getElementById('age')

    let ok = true
    let firstBad = null

    const nameVal = (nameEl.value || '').trim()
    if (nameVal.length < 2 || !nameAllowed.test(nameVal) || containsEmoji(nameVal)) {
      ok = false
      firstBad ||= nameEl
      showError(nameEl, 'Name must be at least 2 characters (letters/numbers only).')
    } else {
      clearError(nameEl)
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
    if (!emailRe.test(emailEl.value || '')) {
      ok = false
      firstBad ||= emailEl
      showError(emailEl, 'Enter a valid email address.')
    } else {
      clearError(emailEl)
    }

    const pw = pwEl.value || ''
    const hasLetter = /[A-Za-z]/.test(pw)
    const hasNumber = /[0-9]/.test(pw)
    const hasSpecial = /[!@#$%^&*()_\-+\=\[\]{};:'",.<>\/?\\|`~]/.test(pw)
    if (pw.length < 8 || !hasLetter || !hasNumber || !hasSpecial) {
      ok = false
      firstBad ||= pwEl
      showError(pwEl, 'Min 8 chars with a letter, number, and special character.')
    } else {
      clearError(pwEl)
    }

    if (pw !== (pwReEl.value || '')) {
      ok = false
      firstBad ||= pwReEl
      showError(pwReEl, 'Passwords do not match.')
    } else {
      clearError(pwReEl)
    }

    const age = Number(ageEl.value)
    if (!Number.isInteger(age) || age < 13 || age > 120) {
      ok = false
      firstBad ||= ageEl
      showError(ageEl, 'Enter a valid age between 13 and 120.')
    } else {
      clearError(ageEl)
    }

    if (!ok && firstBad) {
      firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    return ok
  }

  const validateStep2 = () => {
    const goals = document.querySelectorAll('input[name="dietary-goal"]')
    const goalError = document.getElementById('goal-error')
    const anyChecked = Array.from(goals).some((el) => el.checked)
    if (!anyChecked) {
      if (goalError) {
        goalError.textContent = 'Please select a primary goal.'
        goalError.classList.remove('hidden')
      }
      return false
    }
    if (goalError) {
      goalError.textContent = ''
      goalError.classList.add('hidden')
    }
    return true
  }

  const setStep1Loading = (isLoading) => {
    if (!submitBtn) return
    submitBtn.disabled = isLoading
    submitBtn.style.opacity = isLoading ? '0.6' : '1'
    if (isLoading) submitBtn.dataset.originalText = submitBtn.textContent
    submitBtn.textContent = isLoading ? 'Checking...' : submitBtn.dataset.originalText || 'Continue'
  }

  const setFinishLoading = (isLoading) => {
    if (!finishBtn) return
    finishBtn.disabled = isLoading
    finishBtn.style.opacity = isLoading ? '0.7' : '1'
    if (isLoading) finishBtn.dataset.originalText = finishBtn.textContent
    finishBtn.textContent = isLoading ? 'Creating account...' : finishBtn.dataset.originalText || 'Finish'
  }

  const showFinishError = (msg) => {
    if (!finishErrorEl) return
    finishErrorEl.textContent = msg
    finishErrorEl.classList.remove('hidden')
  }

  const clearFinishError = () => {
    if (!finishErrorEl) return
    finishErrorEl.textContent = ''
    finishErrorEl.classList.add('hidden')
  }

  const goToStep = (step) => {
    state.step = step
    if (step === 1) {
      step1Section?.classList.remove('hidden')
      step1Section?.classList.add('block')
      step2Section?.classList.add('hidden')
      step2Section?.classList.remove('block')
      if (stepLabel) stepLabel.textContent = 'Step 1 of 3: Personal Info'
      if (percentLabel) percentLabel.textContent = '33%'
      if (progressBar) progressBar.style.width = '33%'
    } else {
      step1Section?.classList.add('hidden')
      step1Section?.classList.remove('block')
      step2Section?.classList.remove('hidden')
      step2Section?.classList.add('block')
      if (stepLabel) stepLabel.textContent = 'Step 2 of 3: Dietary Profile'
      if (percentLabel) percentLabel.textContent = '66%'
      if (progressBar) progressBar.style.width = '66%'
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  window.goToStep = goToStep

  const mapGender = (value) => {
    if (value === 'MALE' || value === 'FEMALE' || value === 'OTHER') return value
    return undefined
  }

  const mapGoal = (value) => {
    if (value === 'LOSE_WEIGHT' || value === 'GAIN_MUSCLE' || value === 'MAINTAIN_WEIGHT') return value
    return 'LOSE_WEIGHT'
  }

  const collectStep1Payload = () => {
    const name = document.getElementById('nick-name')?.value?.trim()
    const email = document.getElementById('email')?.value?.trim()
    const password = document.getElementById('password')?.value || ''
    const age = parseInt(document.getElementById('age')?.value || '0', 10)
    const gender = mapGender(document.getElementById('gender')?.value)
    return {
      name,
      email,
      password,
      age: Number.isFinite(age) ? age : undefined,
      gender,
    }
  }

  const collectStep2Payload = () => {
    const goalInput = document.querySelector('input[name="dietary-goal"]:checked')
    const allergiesInput = document.getElementById('allergies')
    const preferences = Array.from(document.querySelectorAll('#step2 input[type="checkbox"]:checked'))
      .map((el) => el.value)
      .filter(Boolean)
    const allergies = (allergiesInput?.value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
    return {
      goalType: mapGoal(goalInput?.value),
      preferredCuisines: preferences.length ? preferences : undefined,
      allergies: allergies.length ? allergies : undefined,
    }
  }

  const buildPayload = () => {
    const base = state.account || {}
    const prefs = collectStep2Payload()
    const payload = {
      ...base,
      goalType: prefs.goalType,
      preferredCuisines: prefs.preferredCuisines,
      allergies: prefs.allergies,
      activityLevel: 'MODERATE',
    }
    return Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== '')
    )
  }

  const handleStep1Submit = async (event) => {
    event.preventDefault()
    if (!validateStep1()) return
    const emailEl = document.getElementById('email')
    clearError(emailEl)
    setStep1Loading(true)
    try {
      const exists = await Api.checkEmail(emailEl.value.trim())
      if (exists) {
        showError(emailEl, 'This email is already registered. Try logging in.')
        emailEl.focus()
        return
      }
      state.account = collectStep1Payload()
      goToStep(2)
    } catch (err) {
      showError(emailEl, 'Unable to verify email right now. Please retry.')
      console.error(err)
    } finally {
      setStep1Loading(false)
    }
  }

  const finishForm = async () => {
    if (!state.account) {
      goToStep(1)
      return
    }
    if (!validateStep2()) return
    clearFinishError()
    setFinishLoading(true)
    try {
      const payload = buildPayload()
      await Api.register(payload)
      window.location.href = '/dashborad.html'
    } catch (err) {
      console.error(err)
      const message = err?.body?.message || err.message || 'Registration failed'
      showFinishError(message)
    } finally {
      setFinishLoading(false)
    }
  }

  formStep1.addEventListener('submit', handleStep1Submit)
  if (finishBtn) finishBtn.addEventListener('click', finishForm)

  ;['nick-name', 'email', 'password', 'password-re', 'age'].forEach((id) => {
    const el = document.getElementById(id)
    if (!el) return
    el.addEventListener('input', () => clearError(el))
  })

  window.finishForm = finishForm
})()
