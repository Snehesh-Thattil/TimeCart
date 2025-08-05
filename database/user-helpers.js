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

            try {
                if (formData.password !== formData.confirmPassword) return reject('Passwords do not match')

                const alreadyExists = await db.get().collection(collections.USERS_COLLECTION).findOne({ email: formData.email })
                if (alreadyExists) {
                    reject('Email already exists')
                }
                else {
                    formData.password = await bcrypt.hash(formData.password, 10)

                    await db.get().collection(collections.USERS_COLLECTION).insertOne(
                        {
                            name: formData.name,
                            email: formData.email,
                            password: formData.password
                        })

                    const user = await db.get().collection(collections.USERS_COLLECTION).findOne({ email: formData.email })
                    resolve(user)
                }
            }
            catch (err) {
                reject(err)
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
    editProfileInfo: (formData, userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                await db.get().collection(collections.USERS_COLLECTION).updateOne(
                    {
                        _id: ObjectId.createFromHexString(userId)
                    },
                    {
                        $set: { ...formData }
                    }
                )

                const newUserData = db.get().collection(collections.USERS_COLLECTION).findOne({ _id: ObjectId.createFromHexString(userId) })

                resolve(newUserData)
            }
            catch (err) {
                reject(err)
            }
        })
    },
    changePassword: (formData, userId) => {
        return new Promise(async (resolve, reject) => {

            if (formData.newPassword !== formData.confirmPassword) return reject('New passwords do not match! ⚠️')

            const user = await db.get().collection(collections.USERS_COLLECTION).findOne({ _id: ObjectId.createFromHexString(userId) })

            const passwordValidate = await bcrypt.compare(formData.currentPassword, user.password)

            if (passwordValidate) {
                const passwordReset = await bcrypt.hash(formData.newPassword, 10)

                await db.get().collection(collections.USERS_COLLECTION).updateOne(
                    {
                        _id: ObjectId.createFromHexString(userId)
                    },
                    {
                        $set: { password: passwordReset }
                    }
                )

                resolve(true)
            }
            else {
                reject('Incorrect current password! ⚠️. Try again')
            }
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
                            _id: 0,
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
    placeOrder: (orderDetails, user, cartInfo) => {
        return new Promise(async (resolve, reject) => {

            // Payment and Order status validation
            const orderStatus = orderDetails.paymentMethod === 'COD' ? 'placed' : 'pending'

            // Generate same orderId for each product order element
            const orderId = new ObjectId()

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

            const date = {
                timestamp: Date.now(),
                iso: new Date().toISOString(),
                orderDate,
                expectedDelivery
            }

            // Delivery address
            const deliveryDetails = {
                addressLine1: orderDetails.addressLine1,
                addressLine2: orderDetails.addressLine2,
                district: orderDetails.district,
                pincode: orderDetails.pincode,
            }

            // User contact details
            const userDetails = {
                userId: ObjectId.createFromHexString(user._id),
                name: user.name,
                mobile: orderDetails.mobile,
                email: orderDetails.email
            }

            try {
                const productOverviews = await db.get().collection(collections.CART_COLLECTION).aggregate([
                    {
                        $match: { user: ObjectId.createFromHexString(user._id) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $lookup: {
                            from: collections.PRODUCTS_COLLECTION,
                            localField: 'products.item',
                            foreignField: '_id',
                            as: 'productFetched'
                        }
                    },
                    {
                        $addFields: {
                            productDetails: { $arrayElemAt: ['$productFetched', 0] }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            productId: '$productDetails._id',
                            sellerId: '$productDetails.seller._id',
                            price: '$productDetails.selling_price',
                            quantity: '$products.quantity',
                            total: { $multiply: ['$products.quantity', '$productDetails.selling_price'] }
                        }
                    }
                ]).toArray()

                for (const overview of productOverviews) {
                    const order = {
                        orderId,
                        deliveryDetails,
                        userDetails,
                        productInfo: overview,
                        paymentMethod: orderDetails.paymentMethod,
                        cartInfo,
                        date,
                        orderStatus
                    }

                    await db.get().collection(collections.ORDERS_COLLECTION).insertOne(order)
                }

                // await db.get().collection(collections.CART_COLLECTION).deleteOne({ user: ObjectId.createFromHexString(user._id) })

                resolve(orderId)
            }
            catch (err) {
                reject(err)
            }
        })
    },
    getOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const orders = await db.get().collection(collections.ORDERS_COLLECTION).aggregate([
                    {
                        $match: { 'userDetails.userId': ObjectId.createFromHexString(userId) }
                    },
                    {
                        $lookup: {
                            from: collections.PRODUCTS_COLLECTION,
                            localField: 'productInfo.productId',
                            foreignField: '_id',
                            as: 'productDetails'
                        }
                    },
                    {
                        $unwind: '$productDetails'
                    },
                    {
                        $project: {
                            orderId: 1,
                            userDetails: 1,
                            deliveryDetails: 1,
                            productInfo: 1,
                            cartInfo: 1,
                            paymentMethod: 1,
                            orderStatus: 1,
                            date: 1,
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
    getOrderDetails: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.ORDERS_COLLECTION).findOne({ orderId: ObjectId.createFromHexString(orderId) })
                .then((result) => {
                    resolve(result)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    getProductOrder: (orderId, productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.ORDERS_COLLECTION).findOne(
                {
                    orderId: ObjectId.createFromHexString(orderId),
                    'productInfo.productId': ObjectId.createFromHexString(productId)
                }
            ).then((result) => resolve(result)).catch((err) => reject(err))
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
        return new Promise(async (resolve, reject) => {
            try {
                if (!ObjectId.isValid(orderId)) return reject(new Error("Invalid orderId"))

                const result = await db.get().collection(collections.ORDERS_COLLECTION).updateMany(
                    { orderId: ObjectId.createFromHexString(orderId) },
                    { $set: { orderStatus: 'placed' } }
                )

                resolve(result.modifiedCount > 0)
            }
            catch (err) {
                reject(err)
            }
        })
    },
    editUserAddress: (formData, email) => {
        return new Promise(async (resolve, reject) => {
            try {
                const user = await db.get().collection(collections.USERS_COLLECTION).findOne({ email: email })
                const passwordValidate = await bcrypt.compare(formData.password, user.password)

                if (passwordValidate) {
                    await db.get().collection(collections.USERS_COLLECTION).updateOne(
                        {
                            email: email
                        },
                        {
                            $set: {
                                'address': {
                                    addressLine1: formData.addressLine1,
                                    addressLine2: formData.addressLine2,
                                    landmark: formData.landmark,
                                    pincode: formData.pincode,
                                    district: formData.district
                                }
                            }
                        }
                    )

                    const updatedUser = await db.get().collection(collections.USERS_COLLECTION).findOne({ email: email })

                    resolve(updatedUser)
                }
                else {
                    reject('Invalid Password')
                }
            }
            catch (err) {
                reject(err)
            }
        })
    }
}
