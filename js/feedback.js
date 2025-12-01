(function () {
  const headingEl = document.getElementById('feedback-heading')
  const titleEl = document.getElementById('feedback-title')
  const descriptionEl = document.getElementById('feedback-description')
  const tagsEl = document.getElementById('feedback-tags')
  const likeButtons = document.querySelectorAll('[data-like]')
  const submitBtn = document.getElementById('feedback-submit')
  const commentEl = document.getElementById('feedback-comment')
  const statusEl = document.getElementById('feedback-status')

  if (!submitBtn) return

  const params = new URLSearchParams(window.location.search || '')
  const requestedRecommendationId = params.get('recommendationId')

  let context = null
  let liked = true

  const setStatus = (message, variant = 'muted') => {
    if (!statusEl) return
    statusEl.textContent = message
    statusEl.classList.remove('text-red-500', 'text-primary', 'text-text-light/70', 'dark:text-text-dark/70')
    if (!message) return
    if (variant === 'error') statusEl.classList.add('text-red-500')
    else if (variant === 'accent') statusEl.classList.add('text-primary')
    else statusEl.classList.add('text-text-light/70', 'dark:text-text-dark/70')
  }

  const renderTags = (tags) => {
    if (!tagsEl) return
    tagsEl.innerHTML = ''
    if (!tags?.length) {
      tagsEl.innerHTML =
        '<p class="text-xs uppercase tracking-wide text-text-light/60 dark:text-text-dark/60">No tags</p>'
      return
    }
    tags.forEach((tag) => {
      const pill = document.createElement('span')
      pill.className =
        'flex h-7 shrink-0 items-center justify-center gap-x-2 rounded-full bg-primary/20 px-3 text-xs font-medium text-text-light dark:text-text-dark'
      pill.textContent = tag
      tagsEl.appendChild(pill)
    })
  }

  const highlightLikeButtons = () => {
    likeButtons.forEach((btn) => {
      const isLiked = btn.dataset.like === 'true'
      btn.classList.toggle('bg-primary/20', liked === true && isLiked)
      btn.classList.toggle('bg-accent/20', liked === false && !isLiked)
    })
  }

  const getComment = () => commentEl?.value?.trim() || ''

  const ensureValidComment = () => {
    const text = getComment()
    if (text.length < 10) {
      setStatus('코멘트를 10자 이상 작성해주세요.', 'error')
      commentEl?.focus()
      return false
    }
    return true
  }

  const hydrate = (rec) => {
    const meal = rec?.meal || {}
    const name = meal.name || 'this meal'
    headingEl && (headingEl.textContent = `How was ${name}?`)
    titleEl && (titleEl.textContent = name)
    descriptionEl && (descriptionEl.textContent = meal.description || rec.reason || 'Tell us how it went.')
    renderTags(Array.isArray(meal.tags) ? meal.tags : [])
  }

  const pickRecommendation = (items) => {
    if (!Array.isArray(items) || !items.length) return null
    if (requestedRecommendationId) {
      return items.find((item) => item.id === requestedRecommendationId) || null
    }
    const accepted = items.filter((item) => item.status === 'ACCEPTED' && !item.consumed)
    return accepted[0] || items[0]
  }

  const loadRecommendation = async () => {
    const limitParam = requestedRecommendationId ? 'limit=100' : 'limit=30'
    setStatus(requestedRecommendationId ? 'Loading your meal…' : 'Loading your latest recommendation…', 'accent')
    try {
      const items = await Api.listRecommendations(limitParam)
      const match = pickRecommendation(items)
      if (!match) {
        const message = requestedRecommendationId
          ? 'The selected meal is no longer available.'
          : 'No recommendations available to review yet.'
        setStatus(message, 'error')
        submitBtn.disabled = true
        return
      }
      context = match
      hydrate(context)
      submitBtn.disabled = false
      setStatus('')
    } catch (err) {
      console.error(err)
      setStatus(err?.body?.message || 'Failed to load recommendation.', 'error')
      submitBtn.disabled = true
    }
  }

  likeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      liked = btn.dataset.like === 'true'
      highlightLikeButtons()
    })
  })

  submitBtn.addEventListener('click', async () => {
    if (!context) {
      setStatus('No recommendation selected.', 'error')
      return
    }
    if (!ensureValidComment()) return
    setStatus('Submitting feedback…', 'accent')
    submitBtn.disabled = true
    try {
      const comment = getComment()
      const payload = {
        recommendationId: context.id,
        mealId: context.meal?.id,
        liked,
        comment,
      }
      await Api.submitFeedback(payload)
      setStatus('Thanks! Your feedback was recorded.')
      commentEl && (commentEl.value = '')
    } catch (err) {
      console.error(err)
      setStatus(err?.body?.message || 'Failed to submit feedback.', 'error')
    } finally {
      submitBtn.disabled = false
    }
  })

  highlightLikeButtons()
  loadRecommendation()
})()
