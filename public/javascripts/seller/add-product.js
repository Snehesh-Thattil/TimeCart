
const imgInputField = document.getElementById('imgInput')
const previewContainer = document.getElementById('imagePreviewContainer')
const selectedFiles = []

// Induce file input field when clicking img tag
function addImage() {
    imgInputField.click()
}

// Update on UI when user makes changes uploaded images
imgInputField.addEventListener('change', function () {
    const files = Array.from(imgInputField.files)

    if (selectedFiles.length + files.length > 10) {
        return alert('Only 10 photos are allowed')
    }

    files.forEach((file) => {
        if (!selectedFiles.find((selected) => selected.name === file.name && selected.lastModified === file.lastModified)) {
            selectedFiles.push(file)
        }
    })
    renderPreviews()
})

// Render changes inthe preview-container div
function renderPreviews() {
    previewContainer.innerHTML = ''

    selectedFiles.forEach((file, index) => {
        const reader = new FileReader()

        reader.onload = function (e) {
            //When file is read successfully:
            const wrapper = document.createElement('div')
            wrapper.classList.add('wrapper')

            const imgElement = document.createElement('img')
            imgElement.src = e.target.result //set src to data URL
            imgElement.alt = 'Preview'

            const delBtn = document.createElement('span')
            delBtn.textContent = '❌'

            delBtn.onclick = () => {
                selectedFiles.splice(index, 1)
                renderPreviews()
            }

            wrapper.appendChild(imgElement)
            wrapper.appendChild(delBtn)
            previewContainer.appendChild(wrapper)
        }
        reader.readAsDataURL(file) //read file as a Base64 URL (suitable for <img src>)
    })

    updateInputFiles()
}

// Reflect the changes in input field files
function updateInputFiles() {
    const dataTransfer = new DataTransfer()
    selectedFiles.forEach((file) => dataTransfer.items.add(file))
    imgInputField.files = dataTransfer.files
}
