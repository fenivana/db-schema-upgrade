# schema-upgrade
Database-agnostic schema upgrading library.

## Usage
```js
async function main() {
  const VERSION_LATEST = 1

  const Schema = require('schema-upgrade')
  const { MongoClient } = require('mongodb')
  const mongoClient = await new MongoClient('mongodb://localhost:27017').connect()
  const db = await mongoClient.db('mydb')
  const collection = db.collection('appInfo')
  let appInfo = await collection.findOne({ key: 'appInfo' })

  if (!appInfo) {
    appInfo = {
      key: 'appInfo',
      version: 0,
      upgrading: false
    }

    await collection.createIndex({ key: 1 }, { unique: true })
    await collection.insertOne(appInfo)
  }

  const schema = new Schema(db, appInfo.version)

  schema.version(1, async db => {
    await db.collection('users').createIndex({ userId: 1 }, { unique: true })
  })

  schema.version(2, async db => {
    await db.collection('users').crateIndex({ openId: 1 }, { unique: true })
  })

  if (!schema.needUpgrade()) return

  const result = await collection.updateOne({
    key: 'appInfo',
    version: appInfo.version,
    upgrading: false
  }, {
    $set: {
      upgrading: true
    }
  })

  if (!result.modifiedCount) {
    throw new Error('Other process is upgrading the database. Please wait.')
  }

  schema.upgrade()

  await collection.updateOne({
    key: 'appInfo',
    version: appInfo.version,
    upgrading: true
  }, {
    $set: {
      version: VERSION_LATEST,
      upgrading: false
    }
  })

  console.log('Database schema upgraded to version ' + VERSION_LATEST) // eslint-disable-line
}

main()
```

## APIs

### new Schema(db, currentVersion)
Create a schema object.

### schema.version(number, upgradeFunction)
Define a version.  
number: the version number.  
upgradeFunction: The operations to run for this version.
It will be called with parameter `db`, and should return a `Promise`.

### schema.needUpgrade()
Returns `true` if upgrade is needed, or `false` otherwise.

### schema.upgrade()
Run the upgrade operations.
