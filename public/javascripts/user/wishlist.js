
function deleteWishlist(productId) {
    $.ajax({
        url: '/remove-from-wishlist/' + productId,
        method: 'DELETE',
        success: () => {
            alert('Removed from wishlist!')

            const itemCard = document.getElementById(productId)
            if (itemCard) itemCard.remove()
        },
        error: (err) => {
            console.error('Failed to remove from wishlist:', err.message)
        }
    })
}