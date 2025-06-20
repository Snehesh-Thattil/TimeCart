
function changeQnty(cartId, productId, change) {
    let quantity = parseInt(document.getElementById(productId).innerHTML)
    change = parseInt(change)

    $.ajax({
        url: '/change-product-qnty',
        method: 'post',
        data: {
            cartId,
            productId,
            change,
            quantity
        },
        success: (response) => {
            if (response.removed) {
                alert('Products removed from cart!')
                location.reload()
            }
            else {
                document.getElementById(productId).innerHTML = quantity + change
            }
        }
    })
}

function removeFromCart(cartId, productId) {
    $.ajax({
        url: '/remove-from-cart',
        method: 'post',
        data: {
            cartId,
            productId
        },
        success: (response) => {
            alert('Item removed from cart')
            location.reload()
        }
    })
}