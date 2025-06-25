
function changeQnty(cartId, productId, userId, change) {
    let quantity = parseInt(document.getElementById(productId).innerHTML)
    change = parseInt(change)

    $.ajax({
        url: '/change-product-qnty',
        method: 'post',
        data: {
            cartId,
            productId,
            userId,
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

                document.getElementById('original_price').innerHTML = response.cartTotal.original_total
                document.getElementById('discounted_price').innerHTML = response.cartTotal.discounted_total

                const couponValue = document.getElementById('coupon-value').innerHTML
                let finalPrice = response.cartTotal.discounted_total - parseInt(couponValue)
                document.getElementById('final_price').innerHTML = finalPrice
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

function moveToWishlist(cartId, productId, userId) {
    $.ajax({
        url: '/move-to-cart',
        method: 'post',
        data: {
            cartId,
            productId,
            userId
        },
        success: (response) => {
            alert('Item moved to Wishlist')
            location.reload()
        }
    })
}