
function orderStatusChange(_id, action) {
    $('button').prop('disabled', true);

    $.ajax({
        url: '/seller/change-order-status',
        method: 'post',
        data: {
            _id,
            action
        },
        success: (updatedOrder) => {
            alert('Order status changed')
            const html = renderDeliveryHtml(updatedOrder);
            $(`#${updatedOrder._id}`).html(html);
        },
        error: (err) => {
            console.error(err)
            alert('Failed to change order status')
            $(buttonEl).prop('disabled', false)
        }
    })
}

function renderDeliveryHtml(order) {
    let html = `<p>Order placed on : ${order.date.orderDate} 🛍️</p>`

    switch (order.orderStatus) {
        case 'placed':
            html += `<button class="actions-btn" onclick="orderStatusChange('${order._id}','packaged')">Mark as packaged 📦</button>`
            break;

        case 'packaged':
            html += `<p>Item packaged on : ${order.date.packaged} 📦</p>`
            html += `<button class="actions-btn" onclick="orderStatusChange('${order._id}','shipped')">Mark as shipped 🏪</button>`
            break;

        case 'shipped':
            html += `<p>Item shipped on : ${order.date.shipped} 🏪</p>`
            html += `<button class="actions-btn" onclick="orderStatusChange('${order._id}','outForDelivery')">Mark as out for delivery ☎️</button>`
            break;

        case 'outForDelivery':
            html += `<p>Item shipped on : ${order.date.shipped} 🏪</p>`
            html += `<p>Item out for delivery : ${order.date.outForDelivery} ☎️</p>`
            html += `<button class="actions-btn" onclick="orderStatusChange('${order._id}','delivered')">Mark as Delivered ✅</button>`
            break;

        case 'delivered':
            html += `<p>Item shipped on : ${order.date.shipped} 🏪</p>`
            html += `<p>Item delivered on : ${order.date.delivered} ✅</p>`
            break;
    }

    return html
}