/* eslint-env mocha */
import { Meteor } from 'meteor/meteor'
import { CollectionFactory, HookNames } from 'meteor/jkuester:meteor-collection-factory'
import { MochaHelpers } from 'meteor/jkuester:meteor-mocha-helpers'
import { assert } from 'meteor/practicalmeteor:chai'
import { Random } from 'meteor/random'
import { Mongo } from 'meteor/mongo'
import SimpleSchema from 'simpl-schema'

describe('(Factory) CollectionFactory - API', function () {

  this.timeout(15000)

  const dropIfHas = function (collectionName) {
    const hasCollection = CollectionFactory.hasCollection(collectionName)
    if (hasCollection) {
      CollectionFactory.dropCollection(collectionName)
    }
  }

  const createCollectionDefault = function (randomName) {
    CollectionFactory.createCollection({name: randomName, explicit: true})
    const collection = CollectionFactory.getCollection(randomName)
    MochaHelpers.isDefined(collection)
    assert.instanceOf(collection, Mongo.Collection)
    return collection
  }

  let randomName

  describe('hasCollection', function () {

    it('returns false if collection does not exist', function (done) {
      randomName = Random.id(10)
      const expectFalse = CollectionFactory.hasCollection(Random.id(17))
      assert.isFalse(expectFalse)
      done()
    })

    it('returns true if collection does exist', function (done) {
      randomName = Random.id(10)
      CollectionFactory.createCollection({name: randomName, explicit: true})
      const expectTrue = CollectionFactory.hasCollection(randomName)
      assert.isTrue(expectTrue)
      dropIfHas(randomName)
      done()
    })
  })

  describe('getCollection', function () {

    it('returns an undefined result, if name is not registered', function (done) {
      const nullCollection = CollectionFactory.getCollection(Random.id(10))
      MochaHelpers.isNotDefined(nullCollection)
      done()
    })

    it('returns a collection instance, if name is registered', function (done) {
      randomName = Random.id(10)
      createCollectionDefault(randomName)
      dropIfHas(randomName)
      done()
    })
  })

  describe('dropCollection', function () {
    if (Meteor.isServer) {
      it('server - drops a collection, that exists', function (done) {
        randomName = Random.id(10)
        createCollectionDefault(randomName)

        assert.isTrue(CollectionFactory.dropCollection(randomName))

        if (Mongo.Collection.remove) {
          assert.isFalse(CollectionFactory.hasCollection(randomName))
          const collection = CollectionFactory.getCollection(randomName)
          MochaHelpers.isNotDefined(collection)
        }
        done()
      })
    }

    if (Meteor.isClient) {
      // there is currently no real drop on minimongo :-/
      it('client - creates a warning, that drop attempt at client does not fulfill completelty', function (done) {
        randomName = Random.id(10)
        createCollectionDefault(randomName)
        assert.isFalse(CollectionFactory.dropCollection(randomName))
        done()
      })
    }
  })

  describe('createCollection', function () {

    describe('default', function () {

      it('createCollection - creates a simple collection without any additionals', function (done) {
        randomName = Random.id(10)
        const collection = CollectionFactory.createCollection({name: randomName, explicit: true})
        MochaHelpers.isDefined(collection, MochaHelpers.OBJECT)
        assert.isTrue(collection instanceof Mongo.Collection)
        assert.equal(collection._name, randomName)
        dropIfHas(randomName)
        done()
      })

      it('createCollection - has created a collection, which is mockable', function (done) {
        randomName = Random.id(10)
        const collection = CollectionFactory.createCollection({name: randomName, explicit: true})
        MochaHelpers.mockUser()
        MochaHelpers.mockCollection(collection, randomName, {})
        dropIfHas(randomName)
        done()
      })

    })

    describe('hooks', function () {

      it('insert', function (done) {
        randomName = Random.id(10)

        const options = {
          name: randomName,
          explicit: true,
          insert: function (doc, callback) {
            doc.createdAt = new Date().getTime()
            doc.createdBy = Random.id(17)
          },
        }
        const collection = CollectionFactory.createCollection(options)

        const id = collection.insert({title: 'test'})
        const doc = collection.findOne({_id: id})
        MochaHelpers.isDefined(doc)
        assert.equal(doc._id, id)

        MochaHelpers.isDefined(doc.createdBy, MochaHelpers.STRING)
        MochaHelpers.isDefined(doc.createdAt, MochaHelpers.NUMBER)
        dropIfHas(randomName)
        done()
      })

      it('update', function (done) {
        randomName = Random.id(10)

        const options = {
          name: randomName,
          explicit: true,
          update: function (query, modifier, options, callback) {
            if (!modifier || !modifier.$set) {
              modifier.$set = {}
            }
            modifier.$set.updatedAt = new Date().getTime()
            modifier.$set.updatedBy = Random.id(17)
          },
        }
        const collection = CollectionFactory.createCollection(options)

        const id = collection.insert({title: 'test', updatedAt: null, updatedBy: null})
        const doc = collection.findOne({_id: id})
        MochaHelpers.isDefined(doc)
        assert.equal(doc._id, id)
        MochaHelpers.isNotDefined(doc.updatedAt)
        MochaHelpers.isNotDefined(doc.updatedBy)

        collection.update({_id: id}, {$set: {title: 'updated'}})
        const updatedDoc = collection.findOne({_id: id})
        assert.notEqual(updatedDoc.title, doc.title)

        MochaHelpers.isDefined(updatedDoc.updatedBy, MochaHelpers.STRING)
        MochaHelpers.isDefined(updatedDoc.updatedAt, MochaHelpers.NUMBER)
        assert.notEqual(updatedDoc.updatedBy, doc.updatedBy)
        assert.notEqual(updatedDoc.updatedAt, doc.updatedAt)

        dropIfHas(randomName)
        done()
      })

      it('remove', function (done) {
        randomName = Random.id(10)

        const options = {
          name: randomName,
          explicit: true,
          remove: function (selector, callback) {
            selector._id = 'prevent-from-remove'
          },
        }
        const collection = CollectionFactory.createCollection(options)
        const docId = collection.insert({title: 'test'})
        const expectFalse = !!(collection.remove({_id: docId}))

        assert.equal(expectFalse, false)
        MochaHelpers.isDefined(collection.findOne(docId), MochaHelpers.OBJECT)

        dropIfHas(randomName)
        done()
      })

      it('has bound the hooks to the collection', function (done) {
        randomName = Random.id(10)

        const hooks = {}
        let doneCalled = false

        function checkHooks () {
          const values = Object.values(hooks)
          if (doneCalled || values.length < Object.keys(HookNames).length) {
            return
          }

          const valid = values.every(key => key === true)
          if (!valid) {
            doneCalled = true
            return done(new Error(`expected hooks to be bound to the collection`))
          } else {
            doneCalled = true
            return done()
          }
        }

        const options = {
          name: randomName,
          explicit: true,
          [HookNames.insert] () {
            const self = this
            hooks[HookNames.insert] = self._name === randomName
            checkHooks()
          },
          [HookNames.update] () {
            const self = this
            hooks[HookNames.update] = self._name === randomName
            checkHooks()
          },
          [HookNames.remove] () {
            const self = this
            hooks[HookNames.remove] = self._name === randomName
            checkHooks()
          },
          [HookNames.afterInsert] () {
            const self = this
            hooks[HookNames.afterInsert] = self._name === randomName
            checkHooks()
          },
          [HookNames.afterUpdate] () {
            const self = this
            hooks[HookNames.afterUpdate] = self._name === randomName
            checkHooks()
          },
          [HookNames.afterRemove] () {
            const self = this
            hooks[HookNames.afterRemove] = self._name === randomName
            checkHooks()
          }
        }
        const collection = CollectionFactory.createCollection(options)
        const docId = collection.insert({title: 'test'})
        collection.update(docId, {$set: {title: 'other test'}})
        collection.remove({_id: docId})
      })
    })

    describe('schema', function () {

      it('attaches a schema to the collection', function (done) {
        randomName = Random.id(10)

        const options = {
          name: randomName,
          explicit: true,
          schema: new SimpleSchema({
            title: String,
          }),
        }

        const collection = CollectionFactory.createCollection(options)
        const docId = collection.insert({title: 'test'})
        const doc = collection.findOne({_id: docId})
        MochaHelpers.isDefined(doc)
        assert.equal(doc._id, docId)

        if (Meteor.isServer) {

          // try invalid-schema documents

          assert.throws(function () {
            collection.insert({})
          })

          assert.throws(function () {
            collection.update(docId, {$set: {title: null}})
          })

          assert.throws(function () {
            collection.insert({bla: 10.123})
          })

          assert.throws(function () {
            collection.insert({someAttr: 'no-no'})
          })

          // try schema-valid document
          const expectValid = collection.insert({title: 'foo'})
          MochaHelpers.isDefined(expectValid, MochaHelpers.STRING)
          const expectValidDoc = collection.findOne(expectValid)
          assert.deepEqual(expectValidDoc, {
            _id: expectValid,
            title: 'foo',
          })

          done()
        } else {

          collection.insert({}, function (err, res) {
            MochaHelpers.isDefined(err)
            assert.isFalse(res)
            done()
          })

        }

      })

      it('createCollection - schema and publicfields', function (done) {
        randomName = Random.id(10)

        const options = {
          name: randomName,
          explicit: true,
          publicFields: {
            title: 1,
          },
        }
        const collection = CollectionFactory.createCollection(options)
        const publicFields = collection.publicFields
        assert.deepEqual(publicFields, {title: 1,})
        done()
      })

    })

    describe('helpers', function () {

      it('createCollection - helpers', function (done) {
        randomName = Random.id(10)

        const helpers = {
          getTitle () {
            return this.title
          }
        }
        const options = {
          name: randomName,
          explicit: true,
          helpers: helpers,
        }
        const collection = CollectionFactory.createCollection(options)
        const docId = collection.insert({title: 'test'})
        const doc = collection.findOne(docId)
        assert.equal(doc.getTitle(), 'test')
        dropIfHas(randomName)
        done()
      })
    })
  })
})
