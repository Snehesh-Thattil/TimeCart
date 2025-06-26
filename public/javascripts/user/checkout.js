
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('checkout-form')

    form.addEventListener('submit', (e) => {
        e.preventDefault()

        const formData = new FormData(form)
        const orderDetails = {}

        formData.forEach((value, key) => {
            orderDetails[key] = value
        })

        $.ajax({
            url: '/place-order',
            method: 'post',
            contentType: 'application/json',
            data: JSON.stringify({
                orderDetails
            }),
            success: (response) => {
                alert('Order Placed')
            },
            error: (err) => {
                console.error(err)
                alert('Failed to place order')
            }
        })
    })
})