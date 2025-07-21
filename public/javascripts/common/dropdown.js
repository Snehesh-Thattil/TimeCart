document.addEventListener('DOMContentLoaded', function () {
    const dropdown = document.getElementById('customDropdown')
    const selected = dropdown.querySelector('.selected')
    const options = dropdown.querySelector('.dropdown-options')
    const hiddenInput = document.getElementById('ratingInput')

    selected.addEventListener('click', () => {
        options.style.display = options.style.display === 'block' ? 'none' : 'block';
    })

    options.querySelectorAll('li').forEach(option => {
        option.addEventListener('click', () => {
            selected.textContent = option.textContent
            hiddenInput.value = option.getAttribute('data-value')
            options.style.display = 'none'
        })
    })

    // Close dropdown if clicked outside
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            options.style.display = 'none'
        }
    })
})
