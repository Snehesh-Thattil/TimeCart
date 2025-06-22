
function addToCart(productId) {
    $.ajax({
        url: '/add-to-cart/' + productId,
        method: 'post',
        success: (response) => {
            if (response.newProductAdded) {
                let count = $('#cart-count').html()
                count = parseInt(count) + 1
                $('#cart-count').html(count)
            }
        }
    })
}