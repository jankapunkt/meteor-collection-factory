import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'

class FactoryCollection extends Mongo.Collection {
  constructor (name, options, optionalArgs = {}) {
    super(name, options)
    this.insertHook = optionalArgs.insert
    this.updateHook = optionalArgs.update
    this.removeHook = optionalArgs.remove
    this.insertAfterHook = optionalArgs.insertAfter
    this.updateAfterHook = optionalArgs.updateAfter
    this.removeAfterHook = optionalArgs.removeAfter
  }

  insert (doc, callback, cb) {
    try {
      if (this.insertHook && Meteor.isServer) {
        this.insertHook(doc, callback, cb)
      }
      const insertResult = super.insert(doc, cb || callback)
      if (this.insertAfterHook && Meteor.isServer) {
        this.insertAfterHook(doc, callback, cb, insertResult)
      }
      return insertResult
    } catch (e) {
      if (this.insertAfterHook && Meteor.isServer) {
        this.insertAfterHook(doc, callback, cb, e)
      }
      throw e
    }
  }

  update (query, modifier, options, callback) {
    try {
      if (this.updateHook && Meteor.isServer) {
        this.updateHook(query, modifier, options, callback)
      }
      const updateResult = super.update(query, modifier, options, callback)
      if (this.updateAfterHook && Meteor.isServer) {
        this.updateAfterHook(query, modifier, options, callback, updateResult)
      }
      return updateResult
    } catch (e) {
      if (this.updateAfterHook && Meteor.isServer) {
        this.updateAfterHook(query, modifier, options, callback, e)
      }
      throw e
    }
  }

  remove (selector, callback) {
    try {
      if (this.removeHook && Meteor.isServer) {
        this.removeHook(selector, callback)
      }
      const removeResult = super.remove(selector, callback)
      if (this.removeAfterHook && Meteor.isServer) {
        this.removeAfterHook(selector, callback, removeResult)
      }
      return removeResult
    } catch (e) {
      if (this.removeAfterHook && Meteor.isServer) {
        this.removeAfterHook(selector, callback, e)
      }
      throw e
    }
  }
}

export const CollectionFactory = {

  hasCollection (name) {
    return !!(Mongo.Collection.get(name))
  },

  getCollection (name) {
    return Mongo.Collection.get(name)
  },

  dropCollection (name) {
    const collection = this.getCollection(name)
    if (!collection) throw new Meteor.Error('cannot drop - collection by name [' + name + '] not found.')
    try {
      collection._dropCollection()
    } catch (e) {
      console.warn('attempt to drop a non initialized collection: ', e.reason || e.message)
      return false
    }
    if (Mongo.Collection.remove) {
      return Mongo.Collection.remove(name)
    } else {
      return true
    }
  },

  createCollection (params) {
    const collectionName = params.name
    const options = params.options
    const schema = params.schema
    const explicit = params.explicit
    const publicFields = params.publicFields
    const helpersObj = params.helpers

    // HOOKS
    const hooksObj = {}
    if (params.insert) hooksObj.insert = params.insert
    if (params.update) hooksObj.update = params.update
    if (params.remove) hooksObj.remove = params.remove

    // AFTER HOOKS
    if (params.insertAfter) hooksObj.insertAfter = params.insertAfter
    if (params.updateAfter) hooksObj.updateAfter = params.updateAfter
    if (params.removeAfter) hooksObj.removeAfter = params.removeAfter

    let collection = this.getCollection()

    if (!collection) {
      collection = new FactoryCollection(collectionName, options, hooksObj)
    }

    if (explicit) {
      const tempId = collection.insert({})
      collection.remove(tempId)
    }

    // internal use
    if (!collection._name) {
      collection._name = collectionName
    }

    // public use
    if (!collection.name) {
      collection.name = collectionName
    }

    // denies all client actions by default, because of security
    // see: https://guide.meteor.com/security.html#allow-deny
    collection.deny({
      insert () { return true },
      update () { return true },
      remove () { return true }
    })

    if (schema) {
      collection.schema = schema
      if (collection.attachSchema) {
        collection.attachSchema(schema)
      }
    }
    if (publicFields) {
      collection.publicFields = publicFields
    }

    if (helpersObj) {
      collection.helpers(helpersObj)
    }

    return collection
  }
}
