const db = require('./connection')
const collections = require('./collections')
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')
const Razorpay = require('razorpay')
const crypto = require('crypto')

// Razorpay Instance for payment
var instance = new Razorpay({ key_id: 'rzp_test_mHLYIG02JZQxRX', key_secret: 'MAuzzAZkbSi4kFxMvLzZV5iE' })

module.exports = {
    doSignup: (formData) => {
        return new Promise(async (resolve, reject) => {

            const alreadyExists = await db.get().collection(collections.USERS_COLLECTION).findOne({ email: formData.email })
            if (alreadyExists) {
                reject('Email already exists')
            }
            else {
                formData.password = await bcrypt.hash(formData.password, 10)

                db.get().collection(collections.USERS_COLLECTION).insertOne(
                    {
                        name: formData.name,
                        email: formData.email,
                        password: formData.password
                    })
                    .then((data) => {
                        console.log('user data after doSignup :', data)
                        resolve(data.insertedId)
                    })
                    .catch((err) => {
                        reject(err)
                    })
            }
        })
    },
    doLogin: (formData) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collections.USERS_COLLECTION).findOne({ email: formData.email })
                .then(async (user) => {
                    if (!user) return reject('No user found')

                    const passwordValidate = await bcrypt.compare(formData.password, user.password)
                    
                    if (passwordValidate) {
                        resolve(user)
                    }
                    else {
                        reject('Password Missmatched')
                    }
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    addToCart: (productId, userId) => {
        const productObj = {
            item: ObjectId.createFromHexString(productId),
            quantity: 1
        }

        return new Promise(async (resolve, reject) => {
            try {
                const userCart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: ObjectId.createFromHexString(userId) })

                if (userCart) {
                    const productExists = userCart.products.findIndex((cartProduct) => cartProduct.item.equals(ObjectId.createFromHexString(productId)))

                    if (productExists !== -1) {
                        await db.get().collection(collections.CART_COLLECTION).updateOne(
                            {
                                user: ObjectId.createFromHexString(userId),
                                'products.item': ObjectId.createFromHexString(productId)
                            },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }
                        )
                        resolve(true)
                    } else {
                        await db.get().collection(collections.CART_COLLECTION).updateOne(
                            {
                                user: ObjectId.createFromHexString(userId)
                            },
                            {
                                $push: { products: productObj }
                            }
                        )
                        resolve({ newProductAdded: true })
                    }
                }
                else {
                    const userCartObj = {
                        user: ObjectId.createFromHexString(userId),
                        products: [productObj]
                    }
                    await db.get().collection(collections.CART_COLLECTION).insertOne(userCartObj)
                    resolve(true)
                }
            }
            catch (err) {
                reject(err)
            }
        })
    },
    getCartItems: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const cartExist = await db.get().collection(collections.CART_COLLECTION).findOne({ user: ObjectId.createFromHexString(userId) })
                if (!cartExist) {
                    return resolve([])
                }

                const cartList = await db.get().collection(collections.CART_COLLECTION).aggregate([
                    {
                        $match: { user: ObjectId.createFromHexString(userId) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity'
                        }
                    },
                    {
                        $lookup: {
                            from: collections.PRODUCTS_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    {
                        $project: {
                            item: 1,
                            quantity: 1,
                            product: { $arrayElemAt: ['$product', 0] }
                        }
                    }
                ]).toArray()
                resolve(cartList)
            }
            catch (err) {
                reject(err)
            }
        })
    },
    getCartOverview: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.CART_COLLECTION).findOne({ user: ObjectId.createFromHexString(userId) })
                .then((data) => {
                    resolve(data.products)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const cartItems = await db.get().collection(collections.CART_COLLECTION).findOne({ user: ObjectId.createFromHexString(userId) })
                if (cartItems) {
                    resolve(cartItems.products.length)
                }
                else {
                    resolve(0)
                }
            }
            catch (err) {
                reject(err)
            }
        })
    },
    changeProductQnty: ({ cartId, productId, change, quantity }) => {
        return new Promise(async (resolve, reject) => {

            change = parseInt(change)
            quantity = parseInt(quantity)

            try {
                if (change === -1 && quantity === 1) {
                    await db.get().collection(collections.CART_COLLECTION).updateOne(
                        {
                            _id: ObjectId.createFromHexString(cartId)
                        },
                        {
                            $pull: { products: { item: ObjectId.createFromHexString(productId) } }
                        }
                    )
                    resolve({ removed: true })
                }
                else {
                    await db.get().collection(collections.CART_COLLECTION).updateOne(
                        {
                            _id: ObjectId.createFromHexString(cartId),
                            'products.item': ObjectId.createFromHexString(productId)
                        },
                        {
                            $inc: { 'products.$.quantity': change }
                        })
                    resolve({ status: true })
                }
            }
            catch (err) {
                reject(err)
            }
        })
    },
    removeFromCart: (productId, cartId) => {
        return new Promise(async (resolve, reject) => {
            try {
                await db.get().collection(collections.CART_COLLECTION).updateOne(
                    {
                        _id: ObjectId.createFromHexString(cartId)
                    },
                    {
                        $pull: { products: { item: ObjectId.createFromHexString(productId) } }
                    }
                )
                resolve(true)
            }
            catch (err) {
                reject(err)
            }
        })
    },
    getCartTotal: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const cartExist = await db.get().collection(collections.CART_COLLECTION).findOne({ user: ObjectId.createFromHexString(userId) })
                if (!cartExist) {
                    return resolve([])
                }

                const cartTotal = await db.get().collection(collections.CART_COLLECTION).aggregate([
                    {
                        $match: { user: ObjectId.createFromHexString(userId) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity'
                        }
                    },
                    {
                        $lookup: {
                            from: collections.PRODUCTS_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    {
                        $project: {
                            item: 1,
                            quantity: 1,
                            product: { $arrayElemAt: ['$product', 0] }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            original_total: { $sum: { $multiply: ['$product.original_price', '$quantity'] } },
                            discounted_total: { $sum: { $multiply: ['$product.selling_price', '$quantity'] } },
                        }
                    },
                    {
                        $addFields: {
                            delivery_charges: 49,
                            coupon_discount: 200
                        }
                    },
                    {
                        $project: {
                            original_total: 1,
                            discounted_total: 1,
                            coupon_discount: 1,
                            delivery_charges: 1,
                            final_payable: {
                                $add: [
                                    { $subtract: ['$discounted_total', '$coupon_discount'] },
                                    '$delivery_charges'
                                ]
                            }
                        }
                    }
                ]).toArray()
                resolve(cartTotal[0])
            }
            catch (err) {
                reject(err)
            }
        })
    },
    addToWishlist: (productId, userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const userWishlist = await db.get().collection(collections.WISHLIST_COLLECTION).findOne({ user: ObjectId.createFromHexString(userId) })

                if (userWishlist) {
                    const wishlistExist = userWishlist.products.findIndex((item) => item.equals(ObjectId.createFromHexString(productId)))

                    if (wishlistExist === -1) {
                        await db.get().collection(collections.WISHLIST_COLLECTION).updateOne(
                            {
                                user: ObjectId.createFromHexString(userId)
                            },
                            {
                                $push: { products: ObjectId.createFromHexString(productId) }
                            }
                        )

                        resolve({ message: 'Added to Wishlist!' })
                    }
                    resolve({ message: 'Wishlist already exists!' })
                }
                else {
                    await db.get().collection(collections.WISHLIST_COLLECTION).insertOne(
                        {
                            user: ObjectId.createFromHexString(userId),
                            products: [ObjectId.createFromHexString(productId)],
                        }
                    )
                    resolve({ message: 'Added to Wishlist!' })
                }
            }
            catch (err) {
                reject(err)
            }
        })
    },
    getWishlist: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const wishlist = await db.get().collection(collections.WISHLIST_COLLECTION).aggregate([
                    {
                        $match: { user: ObjectId.createFromHexString(userId) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $lookup: {
                            from: collections.PRODUCTS_COLLECTION,
                            localField: 'products',
                            foreignField: '_id',
                            as: 'productDetails'
                        }
                    },
                    {
                        $unwind: '$productDetails'
                    },
                    {
                        $replaceRoot: { newRoot: '$productDetails' }
                    }
                ]).toArray()

                resolve(wishlist)
            }
            catch (err) {
                reject(err)
            }
        })
    },
    removeFromWishlist: (productId, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.WISHLIST_COLLECTION).updateOne(
                {
                    user: ObjectId.createFromHexString(userId)
                },
                {
                    $pull: {
                        products: ObjectId.createFromHexString(productId)
                    }
                })
                .then(() => {
                    resolve(true)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    placeOrder: (orderDetails, products, cartTotal) => {
        return new Promise(async (resolve, reject) => {

            // Identify order date and expected delivery date:
            const now = new Date()
            const formatOptions = {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                timeZone: 'Asia/Kolkata'
            }

            const orderDate = now.toLocaleDateString('en-IN', formatOptions)
            const expectedDate = new Date(now)
            expectedDate.setDate(now.getDate() + 7)
            const expectedDelivery = expectedDate.toLocaleDateString('en-IN', formatOptions)

            // Payment and Order status validation
            const orderStatus = orderDetails.paymentMethod === 'COD' ? 'placed' : 'pending'

            try {
                const order = {
                    deliveryDetails: {
                        addressLine1: orderDetails.addressLine1,
                        addressLine2: orderDetails.addressLine2,
                        district: orderDetails.district,
                        pincode: orderDetails.pincode,
                    },
                    userDetails: {
                        userId: ObjectId.createFromHexString(orderDetails.userId),
                        mobile: orderDetails.mobile,
                        email: orderDetails.email
                    },
                    orderValue: { ...cartTotal },
                    products,
                    paymentMethod: orderDetails.paymentMethod,
                    orderStatus,
                    date: {
                        timestamp: Date.now(),
                        iso: new Date().toISOString(),
                        orderDate,
                        expectedDelivery
                    }
                }

                const result = await db.get().collection(collections.ORDERS_COLLCTION).insertOne(order)
                await db.get().collection(collections.CART_COLLECTION).deleteOne({ user: ObjectId.createFromHexString(orderDetails.userId) })

                resolve(result.insertedId)
            }
            catch (err) {
                reject(err)
            }
        })
    },
    getOrderDetails: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.ORDERS_COLLCTION).findOne({ _id: ObjectId.createFromHexString(orderId) })
                .then((result) => {
                    resolve(result)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    getOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const orders = await db.get().collection(collections.ORDERS_COLLCTION).aggregate([
                    {
                        $match: { 'userDetails.userId': ObjectId.createFromHexString(userId) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $lookup: {
                            from: collections.PRODUCTS_COLLECTION,
                            localField: 'products.item',
                            foreignField: '_id',
                            as: 'productDetails'
                        }
                    },
                    {
                        $unwind: '$productDetails'
                    },
                    {
                        $project: {
                            orderId: '$_id',
                            userDetails: 1,
                            deliveryDetails: 1,
                            paymentMethod: 1,
                            paymentStatus: 1,
                            orderStatus: 1,
                            date: 1,
                            orderValue: 1,
                            quantity: '$products.quantity',
                            product: '$productDetails'
                        }
                    }
                ]).toArray()

                resolve(orders)
            }
            catch (err) {
                reject(err)
            }
        })
    },
    generateRazorpay: (orderId, totalValue) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: totalValue * 100,
                currency: "INR",
                receipt: orderId
            }
            instance.orders.create(options, (err, order) => {
                if (err) {
                    console.log(err)
                    reject(err)
                }
                else {
                    resolve(order)
                }
            })
        })
    },
    verifyPayment: (rzpResponse) => {
        return new Promise((resolve, reject) => {
            try {
                let hmac = crypto.createHmac('sha256', 'MAuzzAZkbSi4kFxMvLzZV5iE')

                hmac.update(rzpResponse['response[razorpay_order_id]'] + '|' + rzpResponse['response[razorpay_payment_id]'])
                hmac = hmac.digest('hex')

                if (hmac === rzpResponse['response[razorpay_signature]']) {
                    resolve(true)
                } else {
                    reject()
                }
            }
            catch (err) {
                reject(err)
            }
        })
    },
    changeOrderStatus: (orderId) => {
        return new Promise((resolve, reject) => {

            db.get().collection(collections.ORDERS_COLLCTION).updateOne(
                {
                    _id: ObjectId.createFromHexString(orderId)
                },
                {
                    $set: { orderStatus: 'placed' }
                }
            ).then(() => resolve(true)).catch((err) => reject(err))
        })
    }
}
