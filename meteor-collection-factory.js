import {Meteor} from 'meteor/meteor';
import {Mongo} from 'meteor/mongo';

// INTERNAL

class FactoryCollection extends Mongo.Collection {

	constructor(name, options, optionalArgs) {
		super(name, options);
		this.insertHook = optionalArgs.insert;
		this.updateHook = optionalArgs.update;
		this.removeHook = optionalArgs.remove;
	}

	insert(doc, callback, cb) {
		if (this.insertHook)
			this.insertHook.call(this, doc, callback, cb);
		return super.insert(doc, cb ? cb : callback); // AUTOFORM INSERT CALLBACK FIX
	}

	update(query, modifier, options, callback) {
		if (this.updateHook)
			this.updateHook.call(this, query, modifier, options, callback);
		return super.update(query, modifier, options, callback);
	}

	remove(selector, callback) {
		if (this.removeHook)
			this.removeHook.call(this, selector, callback);
		return super.remove(selector, callback);
	}
}

export const CollectionFactory = {


	hasCollection(name) {
		return !!(Mongo.Collection.get(name));
	},

	getCollection(name) {
		return Mongo.Collection.get(name);
	},

	dropCollection(name) {
		const collection = this.getCollection(name);
		if (!collection) throw new Meteor.Error("cannot drop - collection by name [" + name + "] not found.");
		try {
			collection._dropCollection();

		} catch (e) {
			console.warn("attempt to drop a non initialized collection: ", e.reason || e.message);
			return false;
		}
		return Mongo.Collection.remove(name);
	},

	createCollection(params) {

		const collectionName = params.name;
		const options = params.options;
		const allowObj = params.allow;
		const denyObj = params.deny;
		const schema = params.schema;
		const explicit = params.explicit;
		const publicFields = params.publicFields;
		const helpersObj = params.helpers;

		// HOOKS
		const hooksObj = {};
		if (params.insert) hooksObj.insert = params.insert;
		if (params.update) hooksObj.update = params.update;
		if (params.remove) hooksObj.remove = params.remove;

		let collection = this.getCollection();
		if (collection) return collection;

		collection = new FactoryCollection(collectionName, options, hooksObj);
		console.log(collection.helpers,Mongo.Collection.prototype.helpers);
		if (explicit) {
			collection.insert({test: "test"}, function (err, res) {});
		}

		if (allowObj) collection.allow(allowObj);
		if (denyObj) collection.deny(denyObj);

		if (schema) collection.attachSchema(schema);
		if (publicFields) collection.publicFields = publicFields;

		if (helpersObj) collection.helpers(helpersObj)

		return collection;
	},
};
