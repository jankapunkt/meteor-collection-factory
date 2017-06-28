import {CollectionFactory} from 'meteor/jkuester:meteor-collection-factory';
import {MochaHelpers} from 'meteor/jkuester:meteor-mocha-helpers';
import {chai, assert} from 'meteor/practicalmeteor:chai';
import {Random} from 'meteor/random';
import {Mongo} from 'meteor/mongo';
//import {MethodFactory} from './MethodFactory'; //TODO


describe("(Factory) CollectionFactory - API", function () {

	const dropIfHas = function (collectionName) {
		const hasCollection = CollectionFactory.hasCollection(collectionName);
		if (hasCollection) {
			CollectionFactory.dropCollection(collectionName);
		}
	}

	let randomName;
	beforeEach(function () {
		randomName = Random.id(10);
		dropIfHas(randomName);
	});

	afterEach(function () {
		dropIfHas(randomName);
	});

	it("hasCollection", function () {
		const expectFalse = CollectionFactory.hasCollection(Random.id(17));
		assert.isFalse(expectFalse);

		CollectionFactory.createCollection({name: randomName, explicit: true});
		const expectTrue = CollectionFactory.hasCollection(randomName);
		assert.isTrue(expectTrue);

	});

	it("getCollection", function () {
		const nullCollection = CollectionFactory.getCollection(Random.id(10));
		MochaHelpers.isNotDefined(nullCollection);
	});

	if (Meteor.isServer) {
		// there is currently no real drop on minimongo :-/
		it("dropCollection", function () {
			CollectionFactory.createCollection({name: randomName, explicit: true});
			assert.isTrue(CollectionFactory.hasCollection(randomName));

			CollectionFactory.dropCollection(randomName);
			assert.isFalse(CollectionFactory.hasCollection(randomName));

			const collection = CollectionFactory.getCollection(randomName);
			MochaHelpers.isNotDefined(collection);

		});
	}

	it("createCollection - creates a simple collection without any additionals", function () {
		const collection = CollectionFactory.createCollection({name: randomName, explicit: true});
		MochaHelpers.isDefined(collection, MochaHelpers.OBJECT);
		assert.isTrue(collection instanceof Mongo.Collection);
		assert.equal(collection._name, randomName);
	});

	it("createCollection - has created a collection, which is mockable", function () {
		const collection = CollectionFactory.createCollection({name: randomName, explicit: true});
		MochaHelpers.mockUser();
		MochaHelpers.mockCollection(collection, randomName, {});
	})

	it("createCollection - hooks - insert", function () {
		const options = {
			name: randomName,
			explicit: true,
			insert: function (doc, callback) {
				doc.createdAt = new Date().getTime();
				doc.createdBy = Random.id(17);
			},
		}
		const collection = CollectionFactory.createCollection(options);
		const id = collection.insert({title: "test"})
		const doc = collection.findOne({_id: id});
		MochaHelpers.isDefined(doc);
		assert.equal(doc._id, id);
		MochaHelpers.isDefined(doc.createdBy, MochaHelpers.STRING);
		MochaHelpers.isDefined(doc.createdAt, MochaHelpers.NUMBER);
	});

	it("createCollection - hooks - update", function (done) {
		const options = {
			name: randomName,
			explicit: true,
			update: function (query, modifier, options, callback) {
				if (!modifier || !modifier.$set) {
					modifier.$set = {}
				}
				modifier.$set.updatedAt = new Date().getTime();
				modifier.$set.updatedBy = Random.id(17);
			},
		}
		const collection = CollectionFactory.createCollection(options);

		const id = collection.insert({title: "test", updatedAt: null, updatedBy: null})
		const doc = collection.findOne({_id: id});
		MochaHelpers.isDefined(doc);
		assert.equal(doc._id, id);
		MochaHelpers.isNotDefined(doc.updatedAt);
		MochaHelpers.isNotDefined(doc.updatedBy);

		collection.update({_id: id}, {$set: {title: "updated"}});
		const updatedDoc = collection.findOne({_id: id});
		assert.notEqual(updatedDoc.title, doc.title);
		MochaHelpers.isDefined(updatedDoc.updatedBy, MochaHelpers.STRING);
		MochaHelpers.isDefined(updatedDoc.updatedAt, MochaHelpers.NUMBER);
		assert.notEqual(updatedDoc.updatedBy, doc.updatedBy);
		assert.notEqual(updatedDoc.updatedAt, doc.updatedAt);
		done();
	});

	it("createCollection - hooks - remove", function () {
		const options = {
			name: randomName,
			explicit: true,
			remove: function (selector, callback) {
				selector._id = "prevent-from-remove";
			},
		}
		const collection = CollectionFactory.createCollection(options);
		const docId = collection.insert({title: "test"});
		const expectFalse = !!(collection.remove({_id: docId}));
		assert.equal(expectFalse, false);
		MochaHelpers.isDefined(collection.findOne(docId), MochaHelpers.OBJECT);
	});


	it("createCollection - hooks - allow (allows)", function () {
		MochaHelpers.notImplemented()
	});

	it("createCollection - hooks - allow (not allows)", function () {
		MochaHelpers.notImplemented()
	});

	it("createCollection - hooks - deny (allows)", function () {
		MochaHelpers.notImplemented();
	});

	it("createCollection - hooks - deny (denies)", function () {
		MochaHelpers.notImplemented()
	});

	it("createCollection - hooks - deny/allow mixed", function () {
		MochaHelpers.notImplemented();
	});


	it("createCollection - schema", function () {
		MochaHelpers.notImplemented();
	});

	it("createCollection - schema and publicfields", function () {
		MochaHelpers.notImplemented();
	});

	it("createCollection - helpers", function () {
		const helpers = {
			getTitle(){
				return this.title;
			}
		};
		const options = {
			name: randomName,
			explicit: true,
			helpers: helpers,
		}
		const collection = CollectionFactory.createCollection(options);
		const docId = collection.insert({title: "test"});
		const doc = collection.findOne(docId);
		assert.equal(doc.getTitle(), "test");
	});
})