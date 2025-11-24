(function () {
  const headingEl = document.getElementById('feedback-heading')
  const imageEl = document.getElementById('feedback-image')
  const titleEl = document.getElementById('feedback-title')
  const descriptionEl = document.getElementById('feedback-description')
  const tagsEl = document.getElementById('feedback-tags')
  const likeButtons = document.querySelectorAll('[data-like]')
  const starButtons = document.querySelectorAll('[data-star]')
  const submitBtn = document.getElementById('feedback-submit')
  const commentEl = document.getElementById('feedback-comment')
  const statusEl = document.getElementById('feedback-status')

  if (!submitBtn) return

  let context = null
  let rating = 5
  let liked = true

  const escapeHtml = (str) =>
    String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

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

  const highlightStars = () => {
    starButtons.forEach((star) => {
      const value = Number(star.dataset.star)
      if (value <= rating) star.classList.add('filled')
      else star.classList.remove('filled')
    })
  }

  const hydrate = (rec) => {
    const meal = rec?.meal || {}
    const name = meal.name || 'this meal'
    headingEl && (headingEl.textContent = `How was ${name}?`)
    titleEl && (titleEl.textContent = name)
    descriptionEl && (descriptionEl.textContent = meal.description || rec.reason || 'Tell us how it went.')
    if (imageEl) {
      const url = meal.imageUrl || 'https://via.placeholder.com/800x600?text=Meal'
      imageEl.style.backgroundImage = `url('${url}')`
    }
    renderTags(Array.isArray(meal.tags) ? meal.tags : [])
  }

  const loadRecommendation = async () => {
    setStatus('Loading your latest recommendation…', 'accent')
    try {
      const items = await Api.listRecommendations('limit=1')
      if (!items.length) {
        setStatus('No recommendations available to review yet.', 'error')
        submitBtn.disabled = true
        return
      }
      context = items[0]
      hydrate(context)
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

  starButtons.forEach((star) => {
    star.addEventListener('click', () => {
      rating = Number(star.dataset.star) || rating
      highlightStars()
    })
  })

  submitBtn.addEventListener('click', async () => {
    if (!context) {
      setStatus('No recommendation selected.', 'error')
      return
    }
    setStatus('Submitting feedback…', 'accent')
    submitBtn.disabled = true
    try {
      const payload = {
        recommendationId: context.id,
        mealId: context.meal?.id,
        liked,
        rating,
        comment: commentEl?.value?.trim(),
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
  highlightStars()
  loadRecommendation()
})()
