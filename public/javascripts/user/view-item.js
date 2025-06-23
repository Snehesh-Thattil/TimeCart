
function addToCart(productId, userId) {
    $.ajax({
        url: '/add-to-cart',
        method: 'post',
        data: {
            productId,
            userId
        },
        success: (response) => {
            if (response.newProductAdded) {
                let count = $('#cart-count').html()
                count = parseInt(count) + 1
                $('#cart-count').html(count)
            }
        }
    })
}