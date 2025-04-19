const { MongoClient } = require('mongodb');

const state = {
    db: null
}

module.exports.connect = async (done) => {
    const url = 'mongodb://localhost:27017'
    const dbname = 'products'

    try {
        const client = await MongoClient.connect(url)
        const db = client.db(dbname)
        state.db = db
        done()
    }
    catch (err) {
        console.log('Error connecting MongoClient :', err.message)
        done(err)
    }
}

module.exports.get = () => state.db
