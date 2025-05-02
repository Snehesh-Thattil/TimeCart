const db = require('./connection')
const collections = require('./collections')
const bcrypt = require('bcrypt')

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
    }
}