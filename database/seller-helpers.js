const db = require('./connection')
const collections = require('./collections')
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')

module.exports = {
    doSignup: (formData) => {
        return new Promise(async (resolve, reject) => {
            try {
                if (formData.password !== formData.confirmPassword) return reject('Passwords do not match')

                const alreadyExists = await db.get().collection(collections.SELLERS_COLLECTION).findOne({ email: formData.email })
                if (alreadyExists) {
                    reject('Seller Email Already Exists')
                }
                else {
                    formData.password = await bcrypt.hash(formData.password, 10)

                    await db.get().collection(collections.SELLERS_COLLECTION).insertOne(
                        {
                            name: formData.sellerName,
                            email: formData.email,
                            password: formData.password
                        })
                    const seller = await db.get().collection(collections.SELLERS_COLLECTION).findOne({ email: formData.email })
                    resolve(seller)
                }
            }
            catch (err) {
                reject(err)
            }
        })
    },
    doLogin: (formData) => {
        return new Promise(async (resolve, reject) => {
            try {
                const user = await db.get().collection(collections.SELLERS_COLLECTION).findOne({ email: formData.email })
                if (!user) return reject('No seller found')

                const passwordValidate = await bcrypt.compare(formData.password, user.password)

                if (passwordValidate) {
                    resolve(user)
                }
                else {
                    reject('Password Missmatched')
                }
            }
            catch (err) {
                reject(err)
            }
        })
    },
    editProfileInfo: (formData, sellerId) => {
        return new Promise(async (resolve, reject) => {
            try {
                await db.get().collection(collections.SELLERS_COLLECTION).updateOne(
                    {
                        _id: ObjectId.createFromHexString(sellerId)
                    },
                    {
                        $set: { ...formData }
                    }
                )
                const newSellerData = db.get().collection(collections.SELLERS_COLLECTION).findOne({ _id: ObjectId.createFromHexString(sellerId) })

                resolve(newSellerData)
            }
            catch (err) {
                reject(err)
            }
        })
    },
    changePassword: (formData, sellerId) => {
        return new Promise(async (resolve, reject) => {

            if (formData.newPassword !== formData.confirmPassword) return reject('New passwords do not match! ⚠️')

            const seller = await db.get().collection(collections.SELLERS_COLLECTION).findOne({ _id: ObjectId.createFromHexString(sellerId) })

            const passwordValidate = await bcrypt.compare(formData.currentPassword, seller.password)

            if (passwordValidate) {
                const passwordReset = await bcrypt.hash(formData.newPassword, 10)

                await db.get().collection(collections.USERS_COLLECTION).updateOne(
                    {
                        _id: ObjectId.createFromHexString(sellerId)
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
    getOrders: (sellerId) => {
        return new Promise(async (resolve, reject) => {
            try {
                const orders = await db.get().collection(collections.ORDERS_COLLECTION).aggregate([
                    {
                        $match: { 'productInfo.sellerId': ObjectId.createFromHexString(sellerId) }
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
                    }
                ]).toArray()

                resolve(orders)
            }
            catch (err) {
                reject(err)
            }
        })
    },
    changeOrderStatus: (_id, action) => {
        return new Promise(async (resolve, reject) => {

            // Identify order date and expected delivery date:
            const formatOptions = {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                timeZone: 'Asia/Kolkata'
            }

            const now = new Date()
            const date = now.toLocaleDateString('en-IN', formatOptions)

            try {
                await db.get().collection(collections.ORDERS_COLLECTION).updateOne(
                    {
                        _id: ObjectId.createFromHexString(_id)
                    },
                    {
                        $set: {
                            'orderStatus': action,
                            [`date.${action}`]: date
                        }
                    }
                )

                const updatedOrder = await db.get().collection(collections.ORDERS_COLLECTION).findOne({ _id: ObjectId.createFromHexString(_id) })
                resolve(updatedOrder)
            }
            catch (err) {
                reject(err)
            }
        })
    },
    editSellerLocation: (formData, email) => {
        return new Promise(async (resolve, reject) => {
            try {
                const seller = await db.get().collection(collections.SELLERS_COLLECTION).findOne({ email: email })
                const passwordValidate = await bcrypt.compare(formData.password, seller.password)

                if (passwordValidate) {
                    await db.get().collection(collections.SELLERS_COLLECTION).updateOne(
                        {
                            email: email
                        },
                        {
                            $set: {
                                'location': {
                                    addressLine1: formData.addressLine1,
                                    addressLine2: formData.addressLine2,
                                    landmark: formData.landmark,
                                    pincode: formData.pincode,
                                    district: formData.district
                                }
                            }
                        }
                    )

                    const updatedSeller = await db.get().collection(collections.SELLERS_COLLECTION).findOne({ email: email })

                    resolve(updatedSeller)
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