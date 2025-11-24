(function () {
  const container = document.getElementById('recommendations')
  if (!container) return

  const statusEl = document.getElementById('recommendations-status') || createStatusEl(container)
  const generateBtn = document.getElementById('generateRec')
  const filterButtons = document.querySelectorAll('[data-rec-filter]')
  const slotOptions = [
    { value: 'BREAKFAST', label: 'Breakfast' },
    { value: 'LUNCH', label: 'Lunch' },
    { value: 'DINNER', label: 'Dinner' },
    { value: 'SNACK', label: 'Snack' },
  ]
  const slotLabels = slotOptions.reduce((acc, cur) => ({ ...acc, [cur.value]: cur.label }), {})
  const filterPayloads = {
    all: { mealCount: 3 },
    quick: { mealCount: 1, mood: 'HURRIED' },
    energy: { mealCount: 2, mood: 'ENERGETIC', timeOfDay: 'LUNCH' },
    comfort: { mealCount: 2, mood: 'COMFORT' },
    healthy: { mealCount: 3, goalType: 'LOSE_WEIGHT', mood: 'BALANCED' },
  }

  const STORAGE_KEY = 'nutri_last_recommendations'
  let activeFilter = 'all'
  let currentBatch = []
  let activePicker = null

  const cached = loadStoredBatch()
  if (cached?.length) {
    currentBatch = cached
    setStatus('Showing your latest recommendations.')
    renderRecommendations(currentBatch)
  } else {
    setStatus('Select a mood chip or tap “Get Recommendation” to start.')
    renderRecommendations([])
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.recFilter || 'all'
      activeFilter = key
      updateChipStyles(key)
      fetchRecommendations(key)
    })
  })

  if (generateBtn) {
    generateBtn.addEventListener('click', () => fetchRecommendations(activeFilter))
  }

  function createStatusEl(target) {
    const el = document.createElement('p')
    el.id = 'recommendations-status'
    el.className = 'px-4 text-sm text-subtle-light dark:text-subtle-dark'
    target.parentNode?.insertBefore(el, target)
    return el
  }

  function setStatus(msg, variant = 'muted') {
    if (!statusEl) return
    statusEl.textContent = msg
    statusEl.classList.remove('text-red-500', 'text-primary', 'text-subtle-light', 'text-subtle-dark')
    if (!msg) {
      statusEl.classList.add('text-subtle-light', 'dark:text-subtle-dark')
      return
    }
    if (variant === 'error') {
      statusEl.classList.add('text-red-500')
    } else if (variant === 'accent') {
      statusEl.classList.add('text-primary')
    } else {
      statusEl.classList.add('text-subtle-light', 'dark:text-subtle-dark')
    }
  }

  function updateChipStyles(activeKey) {
    filterButtons.forEach((btn) => {
      const isActive = btn.dataset.recFilter === activeKey
      btn.classList.toggle('bg-primary', isActive)
      btn.classList.toggle('text-text-light', isActive)
      btn.classList.toggle('text-text-dark', !isActive)
    })
  }

  function escapeHtml(str) {
    if (!str) return ''
    return String(str).replace(/[&<>"']/g, (s) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]))
  }

  function formatMacros(meal) {
    if (!meal) return ''
    const pieces = []
    if (meal.calories) pieces.push(`${meal.calories} kcal`)
    if (meal.protein) pieces.push(`${meal.protein}g protein`)
    if (meal.carbs) pieces.push(`${meal.carbs}g carbs`)
    if (meal.fat) pieces.push(`${meal.fat}g fat`)
    return pieces.join(' · ')
  }

  function renderRecommendations(items) {
    closePlanSlotPicker()
    container.innerHTML = ''
    if (!items?.length) {
      container.innerHTML = `
        <div class="col-span-full flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border-light dark:border-border-dark bg-card-light/60 dark:bg-card-dark/60 p-10 text-center">
          <span class="material-symbols-outlined text-4xl text-subtle-light dark:text-subtle-dark">cooking</span>
          <p class="text-base text-subtle-light dark:text-subtle-dark">No recommendations yet. Choose a mood above or tap “Get Recommendation”.</p>
        </div>`
      return
    }

    items.forEach((recommendation) => {
      const meal = recommendation.meal || {}
      const card = document.createElement('article')
      card.className = 'flex flex-col gap-3 p-4 border border-border-light/70 dark:border-border-dark/70 rounded-xl bg-card-light dark:bg-card-dark'
      card.innerHTML = `
        <div class="flex items-center justify-between gap-2">
          <span class="px-2 py-1 rounded-full bg-background-light/80 dark:bg-background-dark/80 text-xs font-semibold text-text-light dark:text-text-dark">${escapeHtml(recommendation.status || 'PENDING')}</span>
          <a href="/detail.html?id=${meal.id}" class="text-sm text-primary font-medium hover:underline">Details</a>
        </div>
        <div class="flex flex-col gap-2">
          <p class="text-base font-semibold text-[#0d1b0d] dark:text-gray-100">${escapeHtml(meal.name || 'Untitled meal')}</p>
          <p class="text-sm text-subtle-light dark:text-primary/90">${escapeHtml(meal.description || recommendation.reason || '')}</p>
          <p class="text-xs uppercase tracking-wide text-text-light/70 dark:text-text-dark/70">${formatMacros(meal)}</p>
          ${renderPlanCta(recommendation)}
        </div>
      `
      container.appendChild(card)
    })

    attachPlanButtons(items)
  }

  function renderPlanCta(recommendation) {
    if (recommendation.status === 'ACCEPTED') {
      const label = slotLabels[recommendation.planSlot] || 'My Plan'
      return `
        <div class="flex items-center justify-between rounded-lg border border-primary/40 px-3 py-2 text-sm text-primary">
          Added to ${label}
          <span class="material-symbols-outlined text-base">task_alt</span>
        </div>
      `
    }
    return `
      <div class="flex flex-col gap-2" data-plan-action="${recommendation.id}">
        <button data-plan-btn="${recommendation.id}" class="flex items-center justify-center rounded-lg bg-primary text-white px-3 py-2 text-sm font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40">
          Add to My Plan
        </button>
      </div>
    `
  }

  function attachPlanButtons(items) {
    container.querySelectorAll('[data-plan-btn]').forEach((btn) => {
      const id = btn.getAttribute('data-plan-btn')
      const recommendation = items.find((item) => item.id === id)
      if (!recommendation) return
      btn.addEventListener('click', () => openPlanSlotPicker(btn, recommendation))
    })
  }

  function openPlanSlotPicker(button, recommendation) {
    closePlanSlotPicker()
    const wrapper = document.createElement('div')
    wrapper.className = 'rounded-lg border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark p-3 text-sm flex flex-col gap-3'
    wrapper.innerHTML = `
      <label class="flex flex-col gap-2 text-text-light dark:text-text-dark">
        Choose meal slot
        <select class="form-select rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark px-3 py-2" data-plan-slot>
          ${slotOptions.map((opt) => `<option value="${opt.value}">${opt.label}</option>`).join('')}
        </select>
      </label>
      <div class="flex gap-2 justify-end">
        <button type="button" data-plan-cancel class="px-3 py-2 rounded-lg border border-border-light dark:border-border-dark">Cancel</button>
        <button type="button" data-plan-confirm class="px-3 py-2 rounded-lg bg-primary text-white font-semibold">Add</button>
      </div>
    `
    button.insertAdjacentElement('afterend', wrapper)
    activePicker = wrapper

    wrapper.querySelector('[data-plan-cancel]').addEventListener('click', closePlanSlotPicker)
    wrapper.querySelector('[data-plan-confirm]').addEventListener('click', async () => {
      const slot = wrapper.querySelector('[data-plan-slot]').value
      await confirmPlanSlot(recommendation, slot)
    })
  }

  function closePlanSlotPicker() {
    if (activePicker) {
      activePicker.remove()
      activePicker = null
    }
  }

  async function confirmPlanSlot(recommendation, slot) {
    try {
      setStatus('Saving to your plan…', 'accent')
      await Api.updateRecommendation(recommendation.id, { status: 'ACCEPTED', planSlot: slot })
      recommendation.status = 'ACCEPTED'
      recommendation.planSlot = slot
      storeBatch(currentBatch)
      closePlanSlotPicker()
      setStatus(`Added to ${slotLabels[slot]}!`)
      renderRecommendations(currentBatch)
    } catch (err) {
      console.error(err)
      setStatus(err?.body?.message || 'Unable to save meal to plan.', 'error')
    }
  }

  function buildPayload(filterKey) {
    const base = { timeOfDay: guessTimeOfDay(), mealCount: 3 }
    const extra = filterPayloads[filterKey] || filterPayloads.all
    return { ...base, ...extra }
  }

  const guessTimeOfDay = () => {
    const hour = new Date().getHours()
    if (hour < 11) return 'BREAKFAST'
    if (hour < 16) return 'LUNCH'
    return 'DINNER'
  }

  async function fetchRecommendations(filterKey) {
    if (generateBtn) generateBtn.disabled = true
    setStatus('Generating recommendations…', 'accent')
    try {
      const payload = buildPayload(filterKey)
      const result = await Api.createRecommendation(payload)
      currentBatch = Array.isArray(result?.recommendations) ? result.recommendations : []
      if (!currentBatch.length) {
        setStatus('No recommendations returned. Try another mood.', 'error')
        clearStoredBatch()
      } else {
        setStatus('')
        storeBatch(currentBatch)
      }
      renderRecommendations(currentBatch)
    } catch (err) {
      console.error(err)
      setStatus(err?.body?.message || 'Failed to generate recommendations.', 'error')
      clearStoredBatch()
    } finally {
      if (generateBtn) generateBtn.disabled = false
    }
  }

  function storeBatch(items) {
    try {
      document.cookie = `${STORAGE_KEY}=${encodeURIComponent(JSON.stringify(items))}; path=/`
    } catch (_) {}
  }

  function loadStoredBatch() {
    try {
      const match = document.cookie.split('; ').find(row => row.startsWith(`${STORAGE_KEY}=`))
      if (!match) return null
      const value = decodeURIComponent(match.split('=')[1])
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : null
    } catch (_) {
      return null
    }
  }

  function clearStoredBatch() {
    try {
      document.cookie = `${STORAGE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    } catch (_) {}
  }
})()
