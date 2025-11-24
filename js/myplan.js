(function () {
  const statsEls = {
    calories: document.getElementById('stat-calories'),
    protein: document.getElementById('stat-protein'),
    fat: document.getElementById('stat-fat'),
    carbs: document.getElementById('stat-carbs'),
  }
  const planContainer = document.getElementById('plan-meals')
  const statusEl = document.getElementById('plan-status')
  const dateLabel = document.getElementById('plan-date')
  const manualForm = document.getElementById('manual-plan-form')
  const manualPanel = document.getElementById('manual-plan-panel')
  const manualToggle = document.getElementById('manual-plan-toggle')
  const manualNameInput = document.getElementById('manual-name')
  const manualSlotSelect = document.getElementById('manual-slot')
  const manualSubmitBtn = document.getElementById('manual-plan-submit')
  const manualStatusEl = document.getElementById('manual-plan-status')
  const prevBtn = document.getElementById('plan-prev')
  const nextBtn = document.getElementById('plan-next')
  const DAY_MS = 24 * 60 * 60 * 1000
  let viewDate = new Date()
  let lastPlanRequestKey = null

  const slotConfig = [
    { key: 'BREAKFAST', label: 'Breakfast', icon: 'wb_sunny' },
    { key: 'LUNCH', label: 'Lunch', icon: 'lunch_dining' },
    { key: 'DINNER', label: 'Dinner', icon: 'restaurant' },
    { key: 'SNACK', label: 'Snack', icon: 'nutrition' },
  ]

  if (!planContainer) return

  refreshPlanView()
  if (manualForm) manualForm.addEventListener('submit', handleManualSubmit)
  if (manualToggle) {
    const toggleLabel = manualToggle.querySelector('.toggle-label')
    manualToggle.addEventListener('click', () => {
      if (!manualPanel) return
      const isHidden = manualPanel.classList.contains('hidden')
      manualPanel.classList.toggle('hidden', !isHidden)
      manualToggle.querySelector('.material-symbols-outlined').textContent = isHidden ? 'remove' : 'add'
      if (toggleLabel) toggleLabel.textContent = isHidden ? 'Hide manual meal form' : 'Add manual meal'
    })
  }
  prevBtn?.addEventListener('click', () => {
    viewDate = new Date(viewDate.getTime() - DAY_MS)
    refreshPlanView()
  })
  nextBtn?.addEventListener('click', () => {
    if (isToday(viewDate)) return
    viewDate = new Date(viewDate.getTime() + DAY_MS)
    refreshPlanView()
  })

  function setDateLabel() {
    if (!dateLabel) return
    const formatter = new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    dateLabel.textContent = formatter.format(viewDate)
  }

  function refreshPlanView() {
    setDateLabel()
    updateNavButtons()
    if (isToday(viewDate)) {
      enableManualEntry(true)
      setStatus('Loading your plan…', 'accent')
      loadStats()
      loadPlan()
    } else {
      enableManualEntry(false)
      updateStats({})
      renderPlan([])
      setStatus('No plan entries saved for this date.', 'muted')
    }
  }

  function updateNavButtons() {
    if (nextBtn) nextBtn.disabled = isToday(viewDate)
  }

  function enableManualEntry(enabled) {
    if (!manualToggle) return
    manualToggle.disabled = !enabled
    if (!enabled) {
      manualPanel?.classList.add('hidden')
      const toggleLabel = manualToggle.querySelector('.toggle-label')
      if (toggleLabel) toggleLabel.textContent = 'Add manual meal'
    }
  }

  function isToday(date) {
    const now = new Date()
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    )
  }

  async function loadStats() {
    try {
      const dashboard = await Api.getDashboard()
      updateStats(dashboard?.nutrition?.weekly?.averages)
    } catch (err) {
      console.error('Failed to load stats', err)
    }
  }

  function updateStats(averages = {}) {
    statsEls.calories && (statsEls.calories.textContent = formatStat(averages.calories, ''))
    statsEls.protein && (statsEls.protein.textContent = formatStat(averages.protein, 'g'))
    statsEls.fat && (statsEls.fat.textContent = formatStat(averages.fat, 'g'))
    statsEls.carbs && (statsEls.carbs.textContent = formatStat(averages.carbs, 'g'))
  }

  function formatStat(value, suffix = '') {
    if (value === undefined || value === null || Number.isNaN(value)) return '--'
    return `${Math.round(value)}${suffix}`
  }

  async function loadPlan() {
    const requestKey = viewDate.getTime()
    lastPlanRequestKey = requestKey
    try {
      const recs = await Api.listRecommendations('limit=30')
      if (lastPlanRequestKey !== requestKey) return
      const accepted = Array.isArray(recs)
        ? recs.filter((item) => item.status === 'ACCEPTED' && !item.consumed)
        : []
      renderPlan(accepted)
      setStatus(accepted.length ? '' : 'Add meals from the dashboard using “Add to My Plan”.')
    } catch (err) {
      console.error('Failed to load plan', err)
      setStatus(err?.body?.message || 'Failed to load your plan.', 'error')
    }
  }

  function setStatus(msg, variant = 'muted') {
    if (!statusEl) return
    statusEl.textContent = msg
    statusEl.classList.remove('text-red-500', 'text-primary', 'text-text-light/70', 'dark:text-text-dark/70')
    if (!msg) return
    if (variant === 'error') {
      statusEl.classList.add('text-red-500')
    } else if (variant === 'accent') {
      statusEl.classList.add('text-primary')
    } else {
      statusEl.classList.add('text-text-light/70', 'dark:text-text-dark/70')
    }
  }

  function renderPlan(recommendations) {
    planContainer.innerHTML = ''
    let hasItems = false

    slotConfig.forEach((slot) => {
      const items = recommendations.filter((item) => item.planSlot === slot.key)
      if (items.length) {
        planContainer.appendChild(createSlotSection(slot, items))
        hasItems = true
      }
    })

    if (!hasItems) {
      planContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center gap-4 rounded-xl p-12 text-center border-2 border-dashed border-border-light dark:border-border-dark bg-card-light/50 dark:bg-card-dark/50">
          <span class="material-symbols-outlined text-5xl text-text-light/40 dark:text-text-dark/40">restaurant_menu</span>
          <h3 class="text-xl font-bold text-text-light dark:text-text-dark">Your plan is empty.</h3>
          <p class="text-text-light/60 dark:text-text-dark/60 max-w-xs">Add meals from the dashboard by tapping “Add to My Plan”.</p>
        </div>`
    }
  }

  function createSlotSection(slot, items) {
    const section = document.createElement('section')
    section.className = 'flex flex-col gap-4 rounded-xl p-6 border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark'

    section.innerHTML = `
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary">${slot.icon}</span>
          <h3 class="text-xl font-bold text-text-light dark:text-text-dark">${slot.label}</h3>
        </div>
        <span class="text-sm text-text-light/60 dark:text-text-dark/60">${items.length ? `${items.length} meals` : 'Empty'}</span>
      </div>
    `

    const list = document.createElement('div')
    list.className = 'flex flex-col divide-y divide-border-light dark:divide-border-dark'

    items.forEach((rec) => {
      const meal = rec.meal || {}
      const macros = formatPlanMacros(meal)
      const row = document.createElement('div')
      row.className = 'flex flex-col gap-2 py-3'
      row.innerHTML = `
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p class="font-semibold text-text-light dark:text-text-dark">${meal.name || 'Untitled meal'}</p>
            <p class="text-sm text-text-light/70 dark:text-text-dark/70">${rec.reason || meal.description || ''}</p>
          </div>
          <div class="flex items-center gap-2">
            <a href="/detail.html?id=${meal.id}" class="text-sm font-medium text-primary hover:underline">Details</a>
            <button type="button" class="text-sm text-red-500 hover:text-red-600" data-plan-delete="${rec.id}">Remove</button>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-4 text-xs uppercase text-text-light/60 dark:text-text-dark/60">
          ${macros}
        </div>
      `
      list.appendChild(row)
    })

    section.appendChild(list)
    return section
  }

  function formatPlanMacros(meal) {
    const data = []
    if (meal.calories) data.push(`${meal.calories} kcal`)
    if (meal.protein) data.push(`${meal.protein}g P`)
    if (meal.carbs) data.push(`${meal.carbs}g C`)
    if (meal.fat) data.push(`${meal.fat}g F`)
    return data.join(' · ')
  }

  async function handleManualSubmit(event) {
    event.preventDefault()
    const name = manualNameInput?.value?.trim()
    const slot = manualSlotSelect?.value
    if (!name || !slot) {
      setManualStatus('Enter a meal name and slot.', 'error')
      return
    }

    setManualStatus('Adding meal to your plan…', 'accent')
    if (manualSubmitBtn) manualSubmitBtn.disabled = true
    try {
      await Api.createManualPlanEntry({ name, planSlot: slot })
      manualNameInput.value = ''
      setManualStatus('Meal added to your plan.')
      await loadPlan()
    } catch (err) {
      console.error('Failed to add manual meal', err)
      setManualStatus(err?.body?.message || 'Failed to add meal.', 'error')
    } finally {
      if (manualSubmitBtn) manualSubmitBtn.disabled = false
    }
  }

  function setManualStatus(msg, variant = 'muted') {
    if (!manualStatusEl) return
    manualStatusEl.textContent = msg
    manualStatusEl.classList.remove('text-red-500', 'text-primary', 'text-text-light/70', 'dark:text-text-dark/70')
    if (!msg) return
    if (variant === 'error') manualStatusEl.classList.add('text-red-500')
    else if (variant === 'accent') manualStatusEl.classList.add('text-primary')
    else manualStatusEl.classList.add('text-text-light/70', 'dark:text-text-dark/70')
  }

  planContainer.addEventListener('click', async (event) => {
    const btn = event.target.closest('[data-plan-delete]')
    if (!btn) return
    const id = btn.getAttribute('data-plan-delete')
    if (!id) return
    const original = btn.textContent
    btn.disabled = true
    btn.textContent = 'Removing…'
    try {
      await Api.deleteRecommendation(id)
      setStatus('Meal removed from your plan.')
      await loadPlan()
    } catch (err) {
      console.error('Failed to remove meal', err)
      setStatus(err?.body?.message || 'Failed to remove meal.', 'error')
      btn.disabled = false
      btn.textContent = original
    }
  })
})()
