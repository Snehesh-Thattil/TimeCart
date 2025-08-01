const db = require('./connection')
const collections = require('./collections')
const { ObjectId } = require('mongodb')

module.exports = {
    addProduct: (product, imgNames, seller) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCTS_COLLECTION).insertOne(
                {
                    ...product,
                    selling_price: parseInt(product.selling_price),
                    original_price: parseInt(product.original_price),
                    imgNames: imgNames,
                    coverImg: imgNames[0],
                    seller: {
                        _id: ObjectId.createFromHexString(seller._id),
                        name: seller.name,
                        email: seller.email,
                    }
                }).then((data) => {
                    resolve(data.insertedId)
                }).catch((err) => {
                    reject(err)
                })
        })
    },
    getProducts: () => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collections.PRODUCTS_COLLECTION).find().toArray()
                .then((products) => {
                    resolve(products)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    getSellerProducts: (sellerId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCTS_COLLECTION).find({ 'seller._id': ObjectId.createFromHexString(sellerId) }).toArray()
                .then((products) => {
                    resolve(products)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    getProductDetails: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCTS_COLLECTION).findOne(
                {
                    _id: ObjectId.createFromHexString(productId)
                })
                .then((data) => {
                    resolve(data)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    updateProduct: (productId, update, newImages, sellerId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCTS_COLLECTION).updateOne(
                {
                    _id: ObjectId.createFromHexString(productId),
                    'seller._id': ObjectId.createFromHexString(sellerId)
                },
                {
                    $set: {
                        brand_name: update.brand_name,
                        product_name: update.product_name,
                        type: update.type,
                        selling_price: parseInt(update.selling_price),
                        original_price: parseInt(update.original_price),
                        description: update.description,
                        imgNames: newImages.map((_, i) => `${productId}_${i}.jpeg`)
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
    deleteProduct: (productId, sellerId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCTS_COLLECTION).deleteOne(
                {
                    _id: ObjectId.createFromHexString(productId),
                    'seller._id': ObjectId.createFromHexString(sellerId)
                })
                .then(() => {
                    resolve(true)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    addReview: (reviewData, user) => {
        return new Promise((resolve, reject) => {
            const newReview = {
                review: reviewData.review,
                rating: reviewData.rating,
                userId: user._id,
                username: user.name
            }

            db.get().collection(collections.REVIEW_COLLECTION).updateOne(
                {
                    productId: ObjectId.createFromHexString(reviewData.productId)
                },
                {
                    $push: { reviewsList: newReview }
                },
                { upsert: true } // create if no doc exist
            ).then(() => resolve(true)).catch((err) => reject(err))
        })
    },
    getProductReviews: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.REVIEW_COLLECTION).find({ productId: ObjectId.createFromHexString(productId) }).toArray()
                .then((data) => {
                    data.length > 0 ? resolve(data[0]?.reviewsList) : resolve([])
                })
                .catch((err) => {
                    reject(err)
                })
        })
    }
}
