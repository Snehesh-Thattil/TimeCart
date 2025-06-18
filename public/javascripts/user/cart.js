
function changeQnty(cartId, productId, count) {
    console.log('AJAX is calling here')
    $.ajax({
        url: '/change-product-qnty',
        method: 'post',
        data: {
            cartId,
            productId,
            count
        },
        success: (response) => {
            alert(response)
        }
    })
}