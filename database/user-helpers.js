const db = require('./connection')
const collections = require('./collections')
const bcrypt = require('bcrypt')

module.exports = {
    doSignup: (formData) => {
        return new Promise(async (resolve, reject) => {
            formData.password = await bcrypt.hash(formData.password, 10)
            db.get().collection(collections.USERS_COLLECTION).insertOne(formData)
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
            db.get().collection(collections.USERS_COLLECTION).findOne({ email: formData.email })
                .then(async (data) => {
                    if (!data) return reject('No user found')

                    const passwordValidate = await bcrypt.compare(formData.password, data.password)
                    if (passwordValidate) {
                        resolve(true)
                    }
                    else {
                        reject('Password Missmatched')
                    }
                })
                .catch((err) => {
                    reject(err)
                })
        })
    }
}