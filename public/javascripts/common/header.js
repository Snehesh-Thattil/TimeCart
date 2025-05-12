function toggle() {
    const navItems = document.querySelector('.nav-items')
    navItems.classList.toggle('hidden')
    document.body.classList.toggle('scroll-prevent')
}