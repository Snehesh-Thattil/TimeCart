const db = require('./connection')
const collections = require('./collections')
const bcrypt = require('bcrypt')

module.exports = {
    doSignup: (formData) => {
        return new Promise(async (resolve, reject) => {
            formData.password = await bcrypt.hash(formData.password, 10)
            await db.get().collection(collections.USERS_COLLECTION).insertOne(formData)
                .then((data) => {
                    resolve(data.insertedId)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    },
    doLogin: (formData) => {
        return new Promise(async (resolve, reject) => {
            // yet to code ...
        })
    }
}