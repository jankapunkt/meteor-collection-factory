import {CollectionFactory} from 'meteor/jkuester:meteor-collection-factory';
import {MochaHelpers} from 'meteor/jkuester:meteor-mocha-helpers';

//import {MethodFactory} from './MethodFactory'; //TODO

let collection;
const collectionName = "somecollection";

describe("(Factory) CollectionFactory", function () {


	it("creates a default curriculum collection", function () {
		collection = CollectionFactory.createCollection(collectionName);
		MochaHelpers.isDefined(collection);
		console.log(collection);
		assert.equal(collection._name, collectionName);
	});

	it("has created a collection, which is mockable", function () {
		MochaHelpers.mockUser();
		MochaHelpers.mockCollection(collection, collectionName, {});
	})

	it("attaches createdBy and createdAt to insert documents", function () {
		const newDoc = MochaHelpers.createMockDoc(collectionName, {});
		MochaHelpers.isDefined(newDoc.createdAt, "number");
		MochaHelpers.isDefined(newDoc.createdBy, "string");
	});

	it("attaches modifiedBy and modifiedAt to update documents", function (done) {

		MethodFactory.getAllowInsert(collection, [collectionName], "test");

		const newDoc = MochaHelpers.createMockDoc(collectionName, {});
		MochaHelpers.isDefined(newDoc.createdAt, "number");
		MochaHelpers.isDefined(newDoc.createdBy, "string");
		MochaHelpers.isNotDefined(newDoc.updatedAt);
		MochaHelpers.isNotDefined(newDoc.updatedBy);

		if (Meteor.isClient) {
			collection.update(newDoc._id, {$set: {title: "sometitle"}}, {}, function (err, res) {
				if (err) done(err);
				if (!res) done(new Error("no update result received"));
				//console.log("update result: ", res);
				const updatedDoc = res;
				MochaHelpers.isDefined(updatedDoc.createdAt, "number");
				MochaHelpers.isDefined(updatedDoc.createdBy, "string");
				MochaHelpers.isDefined(updatedDoc.updatedAt, "number");
				MochaHelpers.isDefined(updatedDoc.updatedBy, "string");
				done();
			});
		}

		if (Meteor.isServer) {
			const updated = collection.update(newDoc, {$set: {title: "sometitle"}});
			assert.isTrue(!!updated);

			const updatedDoc = collection.findOne(newDoc._id);
			//console.log(updatedDoc);
			MochaHelpers.isDefined(updatedDoc.createdAt, "number");
			MochaHelpers.isDefined(updatedDoc.createdBy, "string");
			MochaHelpers.isDefined(updatedDoc.updatedAt, "number");
			MochaHelpers.isDefined(updatedDoc.updatedBy, "string");
			done();
		}
	});

})