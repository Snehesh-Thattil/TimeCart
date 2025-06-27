
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
                const deleveryCharges = document.getElementById('delivery-charges').innerHTML
                let finalPrice = response.cartTotal.discounted_total - parseInt(couponValue) + parseInt(deleveryCharges)
                document.getElementById('final_price').innerHTML = finalPrice
            }
        },
        error: (err) => {
            console.error(err)
            alert('Failed to change product quantity')
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
        },
        error: (err) => {
            console.error(err)
            alert('Failed to remove from cart')
        }
    })
}

function moveToWishlist(cartId, productId, userId) {
    $.ajax({
        url: '/move-to-wishlist',
        method: 'post',
        data: {
            cartId,
            productId,
            userId
        },
        success: (response) => {
            alert('Item moved to Wishlist')
            location.reload()
        },
        error: (err) => {
            console.error(err)
            alert('Failed to move to wishlist')
        }
    })
}