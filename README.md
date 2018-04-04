# schema-upgrade
Database-agnostic schema upgrading library.

## Usage
```js
async function main() {
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

  const latest = schema.latest()

  if (latest === appInfo.version) return

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
      version: latest,
      upgrading: false
    }
  })
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

### schema.latest()
Returns the latest version number, or `null` if no version is defined.

### schema.upgrade()
Run the upgrade operations.
