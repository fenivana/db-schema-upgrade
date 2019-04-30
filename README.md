# schema-upgrade
Database-agnostic schema upgrading library.

## Usage
```js
async function main() {
  const Schema = require('schema-upgrade')

  // connect to mongodb
  const { MongoClient } = require('mongodb')
  const mongoClient = await new MongoClient('mongodb://localhost:27017').connect()
  const db = await mongoClient.db('mydb')

  // get current schema version
  const collection = db.collection('appInfo')
  let appInfo = await collection.findOne({ key: 'appInfo' })

  // appInfo doesn't exist, this is the first time we run the app
  // initialize appInfo struct
  if (!appInfo) {
    appInfo = {
      key: 'appInfo',
      version: 0, // set initial version to 0
      upgrading: false
    }

    await collection.createIndex({ key: 1 }, { unique: true })
    await collection.insertOne(appInfo)
  }

  // create a schema object, provide current db's schema version
  const schema = new Schema(appInfo.version, db)

  // version 1
  schema.version(1, async db => {
    console.log('Upgrading to v1...')
    await db.collection('users').createIndex({ userId: 1 }, { unique: true })
    console.log('Upgraded to v1')
  })

  // version 2
  schema.version(2, async db => {
    console.log('Upgrading to v2...')
    await db.collection('users').crateIndex({ openId: 1 }, { unique: true })
    console.log('Upgraded to v2')
  })

  // get the latest version
  const latest = schema.latest()

  // if db's schema version is the latest
  // no upgrade is needed
  if (latest === appInfo.version) {
    return
  }

  // else we upgrade the schema
  // set 'upgrading' to true to lock the db
  const result = await collection.updateOne({
    key: 'appInfo',
    version: appInfo.version,
    upgrading: false
  }, {
    $set: {
      upgrading: true
    }
  })

  // if 'upgrading' is already true
  // the other server is performing the upgrading
  if (!result.modifiedCount) {
    throw new Error('Other process is upgrading the database. Please wait.')
  }

  // upgrade
  console.log(`Upgrading from version ${appInfo.version} to ${latest}`)
  await schema.upgrade()

  // unlock db
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

  // finished
}

main()
```

## APIs

### new Schema(currentVersion, ...args)
Create a schema object.

#### currentVersion
`Number`. Current schema version.

#### ...args
`Any`. The arguments passed to `upgradeFunction`.

### schema.version(versionNumber, upgradeFunction)
Defines a version.

#### versionNumber
`Number`. The version number.

#### upgradeFunction(...args)
`Function`. The upgrade function. It should return a `Promise`.

### schema.latest()
Returns the latest version number, or `null` if no version is defined.

### schema.upgrade()
Run the upgrade operations.
It will run the `upgradeFunction` from the next version to the latest version.

Returns: `Promise`. Resolves to `true` when upgrade is completed. Rejects if any error occurred.

## LICENSE
MIT
