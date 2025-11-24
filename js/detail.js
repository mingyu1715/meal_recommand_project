(function () {
  const params = new URLSearchParams(window.location.search)
  const mealId = params.get('id')
  const statusEl = document.getElementById('detail-status')

  if (!mealId) {
    statusEl && (statusEl.textContent = 'Missing meal id. Please open this page from a recommendation.')
    return
  }

  const els = {
    title: document.getElementById('detail-title'),
    breadcrumb: document.getElementById('detail-breadcrumb'),
    summary: document.getElementById('detail-summary'),
    calories: document.getElementById('detail-calories'),
    protein: document.getElementById('detail-protein'),
    carbs: document.getElementById('detail-carbs'),
    fat: document.getElementById('detail-fat'),
    serving: document.getElementById('detail-serving'),
    source: document.getElementById('detail-source'),
    tags: document.getElementById('detail-tags'),
  }

  const formatValue = (value, suffix = '') => {
    if (value === undefined || value === null) return '--'
    return `${value}${suffix}`
  }

  const renderTags = (tags) => {
    if (!els.tags) return
    els.tags.innerHTML = ''
    if (!tags?.length) {
      els.tags.innerHTML = '<span class="text-sm text-text-light/60 dark:text-text-dark/60">No tags</span>'
      return
    }
    tags.forEach((tag) => {
      const pill = document.createElement('span')
      pill.className =
        'flex h-7 shrink-0 items-center justify-center gap-x-2 rounded-full bg-primary/20 px-3 text-xs font-medium text-text-light dark:text-text-dark'
      pill.textContent = tag
      els.tags.appendChild(pill)
    })
  }

  const hydrate = (meal) => {
    if (!meal) return
    els.title && (els.title.textContent = meal.name || 'Meal detail')
    els.breadcrumb && (els.breadcrumb.textContent = meal.name || 'Meal detail')
    els.summary && (els.summary.textContent = meal.description || 'No description provided.')
    els.calories && (els.calories.textContent = formatValue(meal.calories, ' kcal'))
    els.protein && (els.protein.textContent = formatValue(meal.protein, ' g'))
    els.carbs && (els.carbs.textContent = formatValue(meal.carbs, ' g'))
    els.fat && (els.fat.textContent = formatValue(meal.fat, ' g'))
    els.serving && (els.serving.textContent = `Serving size: ${meal.servingSize || '1 serving'}`)
    els.source && (els.source.textContent = `Source: ${meal.source || 'AI generated'}`)
    renderTags(Array.isArray(meal.tags) ? meal.tags : [])
  }

  const loadMeal = async () => {
    statusEl && (statusEl.textContent = 'Loading meal...')
    try {
      const meal = await Api.getMeal(mealId)
      if (!meal) {
        statusEl && (statusEl.textContent = 'Meal not found.')
        return
      }
      hydrate(meal)
      statusEl && (statusEl.textContent = '')
    } catch (err) {
      console.error(err)
      statusEl && (statusEl.textContent = err?.body?.message || 'Failed to load meal.')
    }
  }

  loadMeal()
})()
