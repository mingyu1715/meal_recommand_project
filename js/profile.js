(function () {
  const form = document.getElementById('profile-form')
  if (!form) return

  const statusEl = document.getElementById('profile-status')
  const allergyTags = document.getElementById('allergy-tags')
  const allergyInput = document.getElementById('allergy-input')
  const addAllergyBtn = document.getElementById('add-allergy')
  const saveAllergiesBtn = document.getElementById('save-allergies')
  const allergiesStatusEl = document.getElementById('allergies-status')

  const preferenceTags = document.getElementById('preference-tags')
  const preferenceInput = document.getElementById('preference-input')
  const addPreferenceBtn = document.getElementById('add-preference')
  const savePreferencesBtn = document.getElementById('save-preferences')
  const preferencesStatusEl = document.getElementById('preferences-status')

  const fields = {
    name: document.getElementById('profile-name'),
    email: document.getElementById('profile-email'),
    age: document.getElementById('profile-age'),
    gender: document.getElementById('profile-gender'),
    height: document.getElementById('profile-height'),
    weight: document.getElementById('profile-weight'),
    targetWeight: document.getElementById('profile-target-weight'),
    activity: document.getElementById('profile-activity'),
    goal: document.getElementById('profile-goal'),
  }

  const state = {
    allergies: [],
    preferences: [],
  }

  const escapeHtml = (str) =>
    String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

  const normalizeList = (value) => {
    if (!value) return []
    if (Array.isArray(value)) return value.filter(Boolean)
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    }
    return []
  }

  const renderTags = (container, items, emptyText, datasetKey) => {
    if (!container) return
    container.innerHTML = ''
    if (!items.length) {
      container.innerHTML = `<p class="text-sm text-text-light/60 dark:text-text-dark/60">${emptyText}</p>`
      return
    }
    items.forEach((item, index) => {
      const tag = document.createElement('span')
      tag.className =
        'flex items-center gap-1.5 bg-primary/20 text-text-light dark:text-text-dark rounded-full px-3 py-1 text-sm font-medium'
      tag.innerHTML = `
        <span>${escapeHtml(item)}</span>
        <button type="button" data-${datasetKey}="${index}" class="text-text-light/70 dark:text-text-dark/70 hover:text-text-light dark:hover:text-text-dark">
          <span class="material-symbols-outlined text-base">close</span>
        </button>
      `
      container.appendChild(tag)
    })
  }

  const setStatus = (el, message, variant = 'muted') => {
    if (!el) return
    el.textContent = message
    el.classList.remove('text-red-500', 'text-primary', 'text-text-light/70', 'dark:text-text-dark/70')
    if (!message) return
    if (variant === 'error') el.classList.add('text-red-500')
    else if (variant === 'accent') el.classList.add('text-primary')
    else el.classList.add('text-text-light/70', 'dark:text-text-dark/70')
  }

  const fillProfile = (profile) => {
    if (!profile) return
    if (fields.name) fields.name.value = profile.name || ''
    if (fields.email) fields.email.value = profile.email || ''
    if (fields.age) fields.age.value = profile.age ?? ''
    if (fields.gender) fields.gender.value = profile.gender || ''
    if (fields.height) fields.height.value = profile.heightCm ?? ''
    if (fields.weight) fields.weight.value = profile.weightKg ?? ''
    if (fields.targetWeight) fields.targetWeight.value = profile.targetWeightKg ?? ''
    if (fields.activity) fields.activity.value = profile.activityLevel || 'MODERATE'
    if (fields.goal) fields.goal.value = profile.goalType || 'LOSE_WEIGHT'
    state.allergies = normalizeList(profile.allergies)
    renderTags(allergyTags, state.allergies, 'No allergies yet.', 'remove-allergy')
  }

  const fillPreferences = (preferences) => {
    if (!preferences) {
      state.preferences = []
    } else {
      state.preferences = normalizeList(preferences.preferredMealTypes)
    }
    renderTags(preferenceTags, state.preferences, 'No preferences yet.', 'remove-preference')
  }

  const loadData = async () => {
    setStatus(statusEl, 'Loading profile…', 'accent')
    try {
      const [profile, preferences] = await Promise.all([Api.getProfile(), Api.getPreferences()])
      fillProfile(profile)
      fillPreferences(preferences)
      setStatus(statusEl, '')
    } catch (err) {
      console.error(err)
      setStatus(statusEl, 'Failed to load profile information.', 'error')
    }
  }

  const buildProfilePayload = () => {
    const payload = {
      name: fields.name?.value?.trim(),
      age: fields.age?.value ? Number(fields.age.value) : undefined,
      gender: fields.gender?.value || undefined,
      heightCm: fields.height?.value ? Number(fields.height.value) : undefined,
      weightKg: fields.weight?.value ? Number(fields.weight.value) : undefined,
      targetWeightKg: fields.targetWeight?.value ? Number(fields.targetWeight.value) : undefined,
      activityLevel: fields.activity?.value || undefined,
      goalType: fields.goal?.value || undefined,
      allergies: state.allergies,
    }
    return Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== '')
    )
  }

  const handleProfileSubmit = async (event) => {
    event.preventDefault()
    setStatus(statusEl, 'Saving changes…', 'accent')
    try {
      const payload = buildProfilePayload()
      await Api.updateProfile(payload)
      setStatus(statusEl, 'Profile updated successfully.')
    } catch (err) {
      console.error(err)
      setStatus(statusEl, err?.body?.message || 'Failed to update profile.', 'error')
    }
  }

  const addItem = (list, value) => {
    const normalized = (value || '').trim()
    if (!normalized) return list
    const exists = list.some((item) => item.toLowerCase() === normalized.toLowerCase())
    return exists ? list : [...list, normalized]
  }

  const handleAddAllergy = () => {
    if (!allergyInput) return
    state.allergies = addItem(state.allergies, allergyInput.value)
    allergyInput.value = ''
    renderTags(allergyTags, state.allergies, 'No allergies yet.', 'remove-allergy')
  }

  const handleAddPreference = () => {
    if (!preferenceInput) return
    state.preferences = addItem(state.preferences, preferenceInput.value)
    preferenceInput.value = ''
    renderTags(preferenceTags, state.preferences, 'Share the meal types you enjoy.', 'remove-preference')
  }

  const handleTagClick = (event) => {
    const allergyBtn = event.target.closest('[data-remove-allergy]')
    if (allergyBtn) {
      const index = Number(allergyBtn.dataset.removeAllergy)
      state.allergies.splice(index, 1)
      renderTags(allergyTags, state.allergies, 'No allergies yet.', 'remove-allergy')
      return
    }
    const prefBtn = event.target.closest('[data-remove-preference]')
    if (prefBtn) {
      const index = Number(prefBtn.dataset.removePreference)
      state.preferences.splice(index, 1)
      renderTags(preferenceTags, state.preferences, 'Share the meal types you enjoy.', 'remove-preference')
    }
  }

  const saveAllergies = async () => {
    setStatus(allergiesStatusEl, 'Saving…', 'accent')
    try {
      await Api.updateProfile({ allergies: state.allergies })
      setStatus(allergiesStatusEl, 'Allergies saved.')
    } catch (err) {
      console.error(err)
      setStatus(allergiesStatusEl, err?.body?.message || 'Failed to save allergies.', 'error')
    }
  }

  const savePreferences = async () => {
    setStatus(preferencesStatusEl, 'Saving…', 'accent')
    try {
      await Api.updatePreferences({ preferredMealTypes: state.preferences })
      setStatus(preferencesStatusEl, 'Preferences saved.')
    } catch (err) {
      console.error(err)
      setStatus(preferencesStatusEl, err?.body?.message || 'Failed to save preferences.', 'error')
    }
  }

  form.addEventListener('submit', handleProfileSubmit)
  allergyTags?.addEventListener('click', handleTagClick)
  preferenceTags?.addEventListener('click', handleTagClick)
  addAllergyBtn?.addEventListener('click', handleAddAllergy)
  addPreferenceBtn?.addEventListener('click', handleAddPreference)
  saveAllergiesBtn?.addEventListener('click', saveAllergies)
  savePreferencesBtn?.addEventListener('click', savePreferences)

  loadData()
})()
