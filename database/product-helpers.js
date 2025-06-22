const db = require('./connection')
const collections = require('./collections')
const { ObjectId } = require('mongodb')

module.exports = {
    addProduct: (product, imgNames) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCTS_COLLECTION).insertOne({ ...product, selling_price: parseInt(product.selling_price), original_price: parseInt(product.original_price), imgNames: imgNames, coverImg: imgNames[0] })
                .then((data) => {
                    console.log('data added to collection :-', data)
                    resolve(data.insertedId)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    getProducts: () => {
        return new Promise(async (resolve, reject) => {
            try {
                const products = await db.get().collection(collections.PRODUCTS_COLLECTION).find().toArray()
                resolve(products)
            }
            catch (err) {
                reject(err)
            }
        })
    },
    deleteProduct: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCTS_COLLECTION).deleteOne({ _id: ObjectId.createFromHexString(productId) })
                .then(() => {
                    resolve(true)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    getProductDetails: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCTS_COLLECTION).findOne({ _id: ObjectId.createFromHexString(productId) })
                .then((data) => {
                    resolve(data)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    updateProduct: (productId, update) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCTS_COLLECTION).updateOne({ _id: ObjectId.createFromHexString(productId) }, {
                $set: {
                    name: update.name,
                    category: update.category,
                    price: update.price,
                    description: update.description
                }
            })
                .then((res) => {
                    console.log(res)
                    resolve(true)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
}
