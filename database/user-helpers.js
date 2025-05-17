const db = require('./connection')
const collections = require('./collections')
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')

module.exports = {
    doSignup: (formData) => {
        return new Promise(async (resolve, reject) => {

            const alreadyExists = await db.get().collection(collections.USERS_COLLECTION).findOne({ email: formData.email })
            if (alreadyExists) {
                reject('Email already exists')
            }
            else {
                formData.password = await bcrypt.hash(formData.password, 10)

                db.get().collection(collections.USERS_COLLECTION).insertOne(formData)
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
        return new Promise(async (resolve, reject) => {
            try {
                const userCart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: ObjectId.createFromHexString(userId) })

                if (userCart) {
                    await db.get().collection(collections.CART_COLLECTION).updateOne({ user: ObjectId.createFromHexString(userId) },
                        {
                            $push: { products: ObjectId.createFromHexString(productId) }
                        }
                    )
                    resolve(true)
                }
                else {
                    let userCartObj = {
                        user: ObjectId.createFromHexString(userId),
                        products: [ObjectId.createFromHexString(productId)]
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
                        $lookup: {
                            from: collections.PRODUCTS_COLLECTION,
                            let: { userCartProducts: '$products' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $in: ['$_id', '$$userCartProducts']
                                        }
                                    }
                                }
                            ],
                            as: 'cartProducts'
                        }
                    }
                ]).toArray()

                resolve(cartList[0].cartProducts)
            }
            catch (err) {
                reject(err)
            }
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
    }
}