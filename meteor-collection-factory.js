import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check, Match } from 'meteor/check'

export const HookNames = {
  insert: 'insert',
  update: 'update',
  remove: 'remove',
  afterInsert: 'afterInsert',
  afterUpdate: 'afterUpdate',
  afterRemove: 'afterRemove'
}
const oneOfHookNames = name => !!HookNames[ name ]

const execHook = (collection, name) => {
  check(name, Match.Where(oneOfHookNames))
  const ref = collection.hooks[ name ]
  return (ref && ref.on && ref.fct) || (() => {})
}

class FactoryCollection extends Mongo.Collection {
  constructor (name, options, hooks = {}) {
    super(name, options)
    const self = this
    self.hooks = {}
    self.hookNames = HookNames

    Object.keys(hooks).forEach(name => check(name, Match.Where(oneOfHookNames)))

    function addHook (name) {
      check(name, Match.Where(oneOfHookNames))
      const fct = hooks[ name ]
      self.hooks[ name ] = {
        on: !!fct,
        fct: fct && fct.bind(self)
      }
    }

    Object.values(HookNames).forEach(addHook)
  }

  hook (name, value) {
    check(name, Match.Where(oneOfHookNames))
    check(value, Boolean)
    if (this.hooks[ name ]) {
      this.hooks[ name ].on = value
    }
  }

  insert (doc, callback, cb) {
    execHook(this, HookNames.insert)(doc, callback, cb)
    const insertResult = super.insert(doc, cb || callback)
    execHook(this, HookNames.afterInsert)(doc, callback, cb, insertResult)
    return insertResult
  }

  update (query, modifier, options, callback) {
    execHook(this, HookNames.update)(query, modifier, options, callback)
    const updateResult = super.update(query, modifier, options, callback)
    execHook(this, HookNames.afterUpdate)(query, modifier, options, callback, updateResult)
    return updateResult
  }

  remove (selector, callback) {
    execHook(this, HookNames.remove)(selector, callback)
    const removeResult = super.remove(selector, callback)
    execHook(this, HookNames.afterRemove)(selector, callback, removeResult)
    return removeResult
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
    Object.keys(HookNames).forEach(hookName => {
      if (params[ hookName ]) {
        hooksObj[ hookName ] = params[ hookName ]
      }
    })

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
      collection.hook(HookNames.insert, false)
      collection.hook(HookNames.remove, false)

      // insert and remove empty doc
      const tempId = collection.insert({})
      collection.remove(tempId)

      // switch hooks related to insert and remove to off
      collection.hook(HookNames.insert, true)
      collection.hook(HookNames.remove, true)
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

    if (helpersObj && typeof collection.helpers === 'function') {
      collection.helpers(helpersObj)
    }

    return collection
  }
}
