// Toggle navbar on mobile screen
function toggle() {
    const navItems = document.querySelector('.nav-items')
    navItems.classList.toggle('hidden')
    document.body.classList.toggle('scroll-prevent')
}

// Search suggestions
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('search-input')
    const suggestions = document.getElementById('suggestions')

    let debounceTimer
    let controller // for aborting stale requests

    async function fetchSuggestions(query) {
        if (controller) controller.abort()
        controller = new AbortController()

        try {
            const res = await fetch(`/search-suggestions?search=${encodeURIComponent(query)}`, {
                signal: controller.signal
            })
            const { brandmatches, typematches, matches } = await res.json()

            if (brandmatches.length === 0 && typematches.length === 0 && matches.length === 0) {
                suggestions.style.display = 'none'
                suggestions.innerHTML = ''
                return
            }

            const items = []

            if (brandmatches?.length) {
                items.push(...brandmatches.map(brand =>
                    `<div class="suggestion-item category" data-value="${brand}">
             <i class="fa-solid fa-feather"></i>
             <p>${brand}</p>
             <p class='category-name'>Brands</p>
           </div>`))
            }

            if (typematches?.length) {
                items.push(...typematches.map(type =>
                    `<div class="suggestion-item category" data-value="${type}">
             <i class="fa-solid fa-layer-group"></i>
             <p>${type}</p>
             <p class='category-name'>Type</p>
           </div>`))
            }

            if (matches?.length) {
                items.push(...matches.map(match =>
                    `<div class="suggestion-item" data-value="${match}">
             <i class="fa-solid fa-ring"></i>
             <p>${match}</p>
           </div>`))
            }

            suggestions.innerHTML = items.join("")
            suggestions.style.display = 'unset'
        }
        catch (err) {
            if (err.name !== 'AbortError') {
                console.error("Search suggestions error:", err)
            }
        }
    }

    input.addEventListener('input', (e) => {
        const query = e.target.value.trim()

        clearTimeout(debounceTimer)
        if (!query) {
            suggestions.style.display = 'none'
            suggestions.innerHTML = ''
            return
        }

        debounceTimer = setTimeout(() => fetchSuggestions(query), 300)
    })

    // Event delegation for clicks
    suggestions.addEventListener('click', (e) => {
        const item = e.target.closest('.suggestion-item')
        if (item) {
            const value = item.dataset.value
            location.href = `/search-products?search=${value}`
        }
    })

    // Close suggestion box if clicked outside
    document.addEventListener('click', (e) => {
        if (!suggestions.contains(e.target) && e.target !== input) {
            suggestions.style.display = 'none'
            suggestions.innerHTML = ''
        }
    })

    // Close suggestion box on scroll
    window.addEventListener('scroll', () => {
        suggestions.style.display = 'none'
        suggestions.innerHTML = ''
    })
})