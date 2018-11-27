import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check, Match } from 'meteor/check'

const hooksNames = {
  insert: 'insert',
  update: 'update',
  remove: 'remove',
  afterInsert: 'afterInsert',
  afterUpdate: 'afterUpdate',
  afterRemove: 'afterRemove'
}
const oneOfHookNames = name => !!hooksNames[ name ]

class FactoryCollection extends Mongo.Collection {
  constructor (name, options, optionalArgs = {}) {
    super(name, options)
    this.hooks = {}
    this.hookNames = hooksNames

    this.hooks.insert = { on: !!optionalArgs.insert, fct: optionalArgs.insert }
    this.hooks.update = { on: !!optionalArgs.update, fct: optionalArgs.update }
    this.hooks.remove = { on: !!optionalArgs.remove, fct: optionalArgs.remove }

    this.hooks.afterInsert = { on: !!optionalArgs.insertAfter, fct: optionalArgs.insertAfter }
    this.hooks.afterUpdate = { on: !!optionalArgs.updateAfter, fct: optionalArgs.updateAfter }
    this.hooks.afterRemove = { on: !!optionalArgs.removeAfter, fct: optionalArgs.removeAfter }
  }

  hook (name, value) {
    check(name, Match.Where(oneOfHookNames))
    check(value, Boolean)
    if (this.hooks[ name ]) {
      this.hooks[ name ].on = value
    }
  }

  hookActive (name) {
    check(name, Match.Where(oneOfHookNames))
    const ref = this.hooks[ name ]
    return Meteor.isServer && ref && ref.on && ref.fct
  }

  insert (doc, callback, cb) {
    try {
      if (this.hookActive(hooksNames.insert)) {
        this.hooks.insert.fct(doc, callback, cb)
      }
      const insertResult = super.insert(doc, cb || callback)
      if (this.hookActive(hooksNames.afterInsert)) {
        this.hooks.afterInsert.fct(doc, callback, cb, insertResult)
      }
      return insertResult
    } catch (e) {
      if (this.hookActive(hooksNames.afterInsert)) {
        this.hooks.afterInsert.fct(doc, callback, cb, e)
      }
      throw e
    }
  }

  update (query, modifier, options, callback) {
    try {
      if (this.hookActive(hooksNames.update)) {
        this.hooks.update.fct(query, modifier, options, callback)
      }
      const updateResult = super.update(query, modifier, options, callback)
      if (this.hookActive(hooksNames.afterUpdate)) {
        this.hooks.afterUpdate.fct(query, modifier, options, callback, updateResult)
      }
      return updateResult
    } catch (e) {
      if (this.hookActive(hooksNames.afterUpdate)) {
        this.hooks.afterUpdate.fct(query, modifier, options, callback, e)
      }
      throw e
    }
  }

  remove (selector, callback) {
    try {
      if (this.hookActive(hooksNames.remove)) {
        this.hooks.remove.fct(selector, callback)
      }
      const removeResult = super.remove(selector, callback)
      if (this.hookActive(hooksNames.afterRemove)) {
        this.hooks.afterRemove.fct(selector, callback, removeResult)
      }
      return removeResult
    } catch (e) {
      if (this.hookActive(hooksNames.afterRemove)) {
        this.hooks.afterRemove.fct(selector, callback, e)
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

    // in order to force creation of a collection
    // we insert a new document and instantly remove it.
    // We therefore switch hooks to off in order
    // to prevent any hook related errors here.
    if (explicit) {
      // switch hooks related to insert and remove to off
      collection.hook(hooksNames.insert, false)
      collection.hook(hooksNames.remove, false)

      // insert and remove empty doc
      const tempId = collection.insert({})
      collection.remove(tempId)

      // switch hooks related to insert and remove to off
      collection.hook(hooksNames.insert, true)
      collection.hook(hooksNames.remove, true)
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
