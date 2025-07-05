const db = require('./connection')
const collections = require('./collections')
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')

module.exports = {
    doSignup: (formData) => {
        return new Promise(async (resolve, reject) => {
            try {
                const alreadyExists = await db.get().collection(collections.SELLERS_COLLECTION).findOne({ email: formData.email })
                if (alreadyExists) {
                    reject('Seller Email Already Exists')
                }
                else {
                    formData.password = await bcrypt.hash(formData.password, 10)

                    const insertedData = await db.get().collection(collections.SELLERS_COLLECTION).insertOne(
                        {
                            name: formData.sellerName,
                            email: formData.email,
                            password: formData.password
                        })

                    resolve(insertedData.insertedId)
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
    }
}