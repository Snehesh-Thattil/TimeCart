
document.addEventListener('DOMContentLoaded', function () {
    const imageView = document.getElementById('ImgView')
    const imageInput = document.getElementById('ImgInput')

    imageView.addEventListener('click', function () {
        imageInput.click()
    })
})

function changeImg(event) {
    document.getElementById('ImgView').src = URL.createObjectURL(event.target.files[0])
}