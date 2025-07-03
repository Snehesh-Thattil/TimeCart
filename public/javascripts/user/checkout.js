
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
                if (response.paymentMethod === 'COD') {
                    alert('Order Placed')
                    location.href = `/order-success-msg?orderId=${response.orderId}`
                }
                else if (response.paymentMethod === 'ONLINE') {
                    razorpayPayment(response.rzpayOrder)
                }
            },
            error: (err) => {
                console.error(err)
                alert('Failed to place order')
            }
        })
    })
})

function razorpayPayment(rzpayOrder) {
    var options = {
        "key": "rzp_test_mHLYIG02JZQxRX",
        "amount": parseInt(rzpayOrder.amount),
        "currency": "INR",
        "name": "Time Cart Inc.",
        "description": "Test Transaction",
        "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBPemPn96zEFjlLSlEpZUw_dKms8307yFL8Q&s",
        "order_id": rzpayOrder.id,
        "callback_url": "https://eneqd3r9zrjok.x.pipedream.net/",
        // "prefill": {
        //     "name": "Snehesh Thattil", // your customer's name
        //     "email": "sneheshthattil75@gmail.com", // customer's email
        //     "contact": "6235902137" // customer's phone number
        // },
        "handler": function (response) {
            // alert("Payment_Id :", response.razorpay_payment_id)
            // alert("Order_Id :", response.razorpay_order_id)
            // alert("Signature :", response.razorpay_signature)

            verifyPayment(response, rzpayOrder)
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#3399cc"
        }
    }

    var rzp1 = new Razorpay(options)
    rzp1.open()
}

function verifyPayment(response, rzpayOrder) {
    console.log('rzpayOrder Reciept :', rzpayOrder.receipt)

    $.ajax({
        url: '/verify-payment',
        method: 'post',
        data: {
            response,
            rzpayOrder
        },
        success: (response) => {
            if (response.status) {
                location.href = '/order-success-msg?orderId=' + rzpayOrder.receipt
                alert('Order placed successfully')
            } else {
                alert('Somthing went wrong! Try again later.')
            }
        },
        error: (err) => {
            console.error(err)
            alert('Failed to verify payment')
        }
    })
}