document.addEventListener('DOMContentLoaded', function () {
    const imgUploadTrigger = document.getElementById('imgUploadTrigger')
    const imgInput = document.getElementById('imgInput')
    const previewContainer = document.getElementById('imagePreviewContainer')
    const deleteImagesInput = document.getElementById('deleteImages')

    let deletedImages = []
    let selectedFiles = []

    // Open file selector when clicking upload area
    imgUploadTrigger.addEventListener('click', () => imgInput.click())

    // Preview new images
    imgInput.addEventListener('change', function () {
        Array.from(this.files).forEach((file, index) => {
            selectedFiles.push(file)

            const reader = new FileReader()

            reader.onload = (e) => {
                const wrapper = document.createElement('div')
                wrapper.classList.add('wrapper')
                wrapper.innerHTML = `
                    <img src="${e.target.result}" alt="preview">
                    <span class="remove-btn">❌</span>`

                wrapper.querySelector('.remove-btn').addEventListener('click', () => {
                    selectedFiles = selectedFiles.filter((selectedItem) => selectedItem !== file)

                    const dataTransfer = new DataTransfer()
                    selectedFiles.forEach((selectedItem) => dataTransfer.items.add(selectedItem))
                    imgInput.files = dataTransfer.files

                    wrapper.remove()
                })

                previewContainer.appendChild(wrapper)
            }
            reader.readAsDataURL(file)
        })

        const dataTransfer = new DataTransfer()
        selectedFiles.forEach((selectedItem) => dataTransfer.items.add(selectedItem))
        imgInput.files = dataTransfer.files
    })

    // Remove existing image
    previewContainer.addEventListener('click', function (e) {
        if (e.target.classList.contains('remove-btn')) {
            const wrapper = e.target.closest('.wrapper')

            if (wrapper.dataset.existing === "true") {
                deletedImages.push(wrapper.dataset.filename)
                deleteImagesInput.value = JSON.stringify(deletedImages)
            }
            wrapper.remove()
        }
    })
})