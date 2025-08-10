
function orderStatusChange(_id, action) {
    $('button').prop('disabled', true)

    $.ajax({
        url: '/seller/change-order-status',
        method: 'post',
        data: {
            _id,
            action
        },
        success: (updatedOrder) => {
            alert('Order status changed')
            const updatedHtml = renderUpdatedHtml(updatedOrder)
            $(`#${updatedOrder._id}`).html(updatedHtml)
            $('button').prop('disabled', false)
        },
        error: (err) => {
            console.error(err)
            alert('Failed to change order status')
            $(buttonEl).prop('disabled', false)
        }
    })
}

function renderUpdatedHtml(order) {
    let html = ``
    switch (order.orderStatus) {
        case 'packaged':
            html += `<p>Order placed on : ${order.date.orderDate} 🛍️</p>`
            html += `<p>Item packaged on : ${order.date.packaged} 📦</p>`
            html += `<button class="actions-btn" onclick="orderStatusChange('${order._id}','shipped')">Mark as shipped 🏪</button>`
            break;

        case 'shipped':
            html += `<p>Order placed on : ${order.date.orderDate} 🛍️</p>`
            html += `<p>Item shipped on : ${order.date.shipped} 🏪</p>`
            html += `<button class="actions-btn" onclick="orderStatusChange('${order._id}','outForDelivery')">Mark as out for delivery ☎️</button>`
            break;

        case 'outForDelivery':
            html += `<p>Order placed on : ${order.date.orderDate} 🛍️</p>`
            html += `<p>Item shipped on : ${order.date.shipped} 🏪</p>`
            html += `<p>Item out for delivery : ${order.date.outForDelivery} ☎️</p>`
            html += `<button class="actions-btn" onclick="orderStatusChange('${order._id}','delivered')">Mark as Delivered ✅</button>`
            break;

        case 'delivered':
            html += `<p>Order placed on : ${order.date.orderDate} 🛍️</p>`
            html += `<p>Item shipped on : ${order.date.shipped} 🏪</p>`
            html += `<p>Item delivered on : ${order.date.delivered} ✅</p>`
            break;
        case 'returnCompleted':
            html += `<h4 class="date">✅ Product has been successfully returned</h4>`
            html += `<p class="order-status">Return completed on :
                        <span class="exp-del-date">${order.date.returnCompleted}}</span>.
                    </p>`
    }

    return html
}