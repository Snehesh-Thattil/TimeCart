const db = require('./connection')
const collections = require('./collections')
const { ObjectId } = require('mongodb')

module.exports = {
    addProduct: (product, callback) => {

        db.get().collection(collections.PRODUCTS_COLLECTION).insertOne(product)
            .then((data) => {
                console.log('data added to collection :-', data)
                callback(null, data.insertedId)
            })
            .catch((err) => {
                callback(err)
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
}