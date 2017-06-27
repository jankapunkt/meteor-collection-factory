import {MochaHelpers} from 'meteor/jkuester:meteor-mocha-helpers';

export const TestSuite = {
	testCollection(collectionTestDef) {
		describe('(Collection) ' + collectionTestDef.objName, () => {
			this.defineMockFactory(collectionTestDef);
			this.testMutators(collectionTestDef);
			this.testSchema(collectionTestDef);
			this.testPublications(collectionTestDef);
			this.testMethods(collectionTestDef);
		});
	},

	defineMockFactory(collectionEntry) {
		describe('Factory', () => {
			it('registers a collection to the mocking factory', function (done) {

				const collection = collectionEntry.obj;
				MochaHelpers.isDefined(collection);
				const factoryName = collectionEntry.name;
				MochaHelpers.isDefined(factoryName);
				const factoryProps = MochaHelpers.getDefaultPropsWith(collectionEntry.factoryProps);
				MochaHelpers.isDefined(factoryProps, 'object');
				MochaHelpers.mockCollection(collection, factoryName, factoryProps);
				done();
			});
		});
	},

	testMutators(collectionEntry) {
		describe('Mutators', () => {
			it('builds a document, containing minimum of the schema', () => {

				//DOES THE FACTORY CREATE AT LEAST THE MINIMAL SCHEMA
				const document = Factory.build(collectionEntry.name);
				MochaHelpers.isDocumentDefined(document);
			});

			it('creates a document, containing minimum of the schema', () => {

				//DOES THE FACTORY CREATE AT LEAST THE MINIMAL SCHEMA
				const document = Factory.create(collectionEntry.name);
				MochaHelpers.isDocumentDefined(document);
			});
		});
	},

	testPublications(collectionEntry) {
		const collection = collectionEntry.obj;
		const factoryName = collectionEntry.name;
		const collectionName = collectionEntry.objName;
		const collectionPubs = collectionEntry.publications;
		const factoryProps = MochaHelpers.getDefaultPropsWith(collectionEntry.factoryProps);

		describe('Publications', () => {

			const createDocument = (props = {}) => {
				const document = Factory.create(factoryName, props);
				MochaHelpers.isDefined(document, 'object');
			};

			let userId;

			beforeEach(() => {
				const findUser = Meteor.users.findOne({username: "john doe"});
				if (findUser) {
					userId = findUser._id;
				} else {
					Meteor.users.remove({username: "john doe"});
					userId = Accounts.createUser({username: "john doe"});
				}

				collection.remove({});
				_.times(3, () => createDocument(factoryProps));
			});

			afterEach(() => {
				Meteor.users.remove({_id: userId});
				collection.remove({});
				assert.equal(collection.find({}).count(), 0);
			});


			const publicationList = Object.values(collectionPubs);
			for (let publicationName of publicationList) {

				it(publicationName + " (valid user)", (done) => {
					assert.equal(collection.find({}).count(), 3);
					MochaHelpers.collectPublication(userId, publicationName, collectionName, 3);
					done();
				});

				it(publicationName + " (no logged in user)", (done) => {
					assert.equal(collection.find({}).count(), 3);
					assert.throws(function () {
						MochaHelpers.collectPublication(null, publicationName, collectionName, 3);
					}, Error, CaroContext.errors.PERMISSION_NOT_LOGGED_IN);
					done();
				});

				it(publicationName + " (non registered in user)", (done) => {
					assert.equal(collection.find({}).count(), 3);
					assert.throws(function () {
						MochaHelpers.collectPublication(Random.id(17), publicationName, collectionName, 3);
					}, Error, CaroContext.errors.PERMISSION_NOT_REGISTERED_USER);
					done();
				});

				if (factoryProps.parent) {
					it(publicationName + " (filter by parent, success)", (done) => {
						assert.equal(collection.find({}).count(), 3);
						const collector = new PublicationCollector({userId: userId});
						collector.collect(publicationName, 20, {parent: factoryProps.parent}, (factorycollections) => {
							chai.assert.equal(factorycollections[collectionName].length, 3);
							done();
						});
						//MochaHelpers.collectPublication(userId, publicationName, 3);
					});

					it(publicationName + " (filter by parent, empty)", (done) => {
						assert.equal(collection.find({}).count(), 3);
						const collector = new PublicationCollector({userId: userId});
						collector.collect(publicationName, 20, {parent: Random.id(17)}, (factorycollections) => {
							assert.isUndefined(factorycollections[collectionName]);
							//chai.assert.equal(factorycollections[collectionName].length, 0);
							done();
						});
					});
				}
			}

		});
	},


	testMethods(collectionEntry) {
		describe(collectionEntry.name + ': Methods', () => {
			const methodNames = Object.values(collectionEntry.methods);
			for (let methodName of methodNames) {
				it(methodName, () => {
					assert.fail("not yet implemented");
				});
			}
		});
	},

	testSchema(collectionEntry) {
		const collection = collectionEntry.obj;
		const collectionName = collectionEntry.name;

		describe(collectionName + ': Schema', () => {

			it('has all keys of the defaultSchema', () => {
				const defaultSchema = MochaHelpers.defaultSchema();
				const schema = collection.schema;

				const defaulSchemaKeys = defaultSchema._schemaKeys;
				const schemaKeys = schema._schemaKeys;

				MochaHelpers.hasAllEntriesOf(defaulSchemaKeys, schemaKeys);
			});

			it('has all public fields in its schema', () => {
				const schema = collection.schema._schemaKeys;
				MochaHelpers.isDefined(schema);
				const publicFields = Object.keys(collection.publicFields);
				MochaHelpers.isDefined(schema);
				MochaHelpers.hasAllEntriesOf(publicFields, schema);
			});
		});

	},

}