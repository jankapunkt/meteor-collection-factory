import {Meteor} from 'meteor/meteor';
import {Mongo} from 'meteor/mongo';
import {SimpleSchemaFactory} from 'meteor/jkuester:simpl-schema-factory';

//checkNpmVersions({ 'simpl-schema': '0.x.x' }, 'jkuester:meteor-collection-factory');

const SimpleSchema = require('simpl-schema').default;
// INTERNAL

class FactoryCollection extends Mongo.Collection {

	constructor(name, options, optionalArgs) {
		super(name, options);
		this.insertHook = optionalArgs.insert;
		this.updateHook = optionalArgs.update;
		this.removeHook = optionalArgs.remove;
	}

	insert(doc, callback, cb) {
		if (this.insertHook && Meteor.isServer)
			this.insertHook.call(this, doc, callback, cb);
		return super.insert(doc, cb ? cb : callback); // AUTOFORM INSERT CALLBACK FIX
	}

	update(query, modifier, options, callback) {
		if (this.updateHook && Meteor.isServer)
			this.updateHook.call(this, query, modifier, options, callback);
		return super.update(query, modifier, options, callback);
	}

	remove(selector, callback) {
		if (this.removeHook && Meteor.isServer)
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
		if (!collection)
			collection = new FactoryCollection(collectionName, options, hooksObj);
		if (explicit) {
			const tempId = collection.insert({test: "test"});
			collection.remove(tempId);
		}

		// denies all client actions by default, because of security
		// see: https://guide.meteor.com/security.html#allow-deny
		collection.deny({
			insert() { return true; },
			update() { return true; },
			remove() { return true; },
		});

		if (schema) {
			if (schema instanceof SimpleSchema){
				collection.schema = schema;
				collection.attachSchema(schema);
			}else{
				const tmpschema = SimpleSchemaFactory.defaultSchemaWith(schema);
				collection.schema = tmpschema;
				collection.attachSchema(tmpschema);
			}
		}
		if (publicFields) collection.publicFields = publicFields;

		if (helpersObj) collection.helpers(helpersObj)

		return collection;
	},
};
