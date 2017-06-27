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

	createCollection(params) {

		const collectionName = params.name;
		const allowObj = params.allow;
		const denyObj = params.deny;
		const schema = params.schema;
		const publicFields = params.publicFields;
		const helpersObj = params.helpers;

		// HOOKS
		const hooksObj = {};
		if (params.insert) hooksObj.insert = params.insert;
		if (params.update) hooksObj.insert = params.update;
		if (params.remove) hooksObj.insert = params.remove;

		let collection = Mongo.Collection.get(collectionName);
		if (collection)
			return collection;

		collection = new FactoryCollection(collectionName, hooksObj);

		if (allowObj) collection.allow(allowObj);
		if (denyObj) collection.deny(denyObj);

		if (schema) collection.attachSchema(schema);
		if (publicFields) collection.publicFields = publicFields;

		if (helpersObj) collection.helpers(helpersObj)

		return collection;
	},
};
