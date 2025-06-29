
function viewImg(imgName) {
    const viewedImg = document.getElementById('viewed-img')
    viewedImg.src = `/images/products/${imgName}`

    document.querySelectorAll('.photos-list img').forEach(img => img.classList.remove('selected'));
    const selectedImg = [...document.querySelectorAll('.photos-list img')].find((img) => img.src.includes(imgName))
    if (selectedImg) selectedImg.classList.add('selected')
}