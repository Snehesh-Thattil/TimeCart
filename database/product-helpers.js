const db = require('../database/connection')

module.exports = {
    addProduct: (product, callback) => {
        console.log('addProduct function called :-', product)

        db.get().collection('products').insertOne(product)
            .then((data) => {
                console.log('data added to collection :-', data)
                callback(null, data.insertedId)
            })
            .catch((err) => {
                callback(err)
            })
    }
}