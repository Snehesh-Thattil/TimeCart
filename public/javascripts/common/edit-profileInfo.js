
document.addEventListener('DOMContentLoaded', () => {
    const imgInput = document.getElementById('imgInput');
    const imgage = document.getElementById('image');

    if (!imgInput) return console.warn('imgInput missing')
    if (!imgage) return console.warn('image element missing')

    imgage.addEventListener('click', () => imgInput.click())

    imgInput.addEventListener('change', () => {
        const file = imgInput.files[0]
        if (file) {
            imgage.src = URL.createObjectURL(file)
        }
    })
})
