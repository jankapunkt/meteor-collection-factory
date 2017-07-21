Package.describe({
	name: 'jkuester:meteor-collection-factory',
	version: '0.1.3',
	// Brief, one-line summary of the package.
	summary: 'Factory for creating Mongo.Collection instances.',
	// URL to the Git repository containing the source code for this package.
	git: 'https://github.com/jankapunkt/meteor-collection-factory.git',
	// By default, Meteor will default to using README.md for documentation.
	// To avoid submitting documentation, set this field to null.
	documentation: 'README.md'
});

Package.onUse(function (api) {
	api.versionsFrom('1.5');
	api.use('ecmascript');
	api.use('mongo');
	api.use('jkuester:simpl-schema-factory@0.1.0');
	api.use('dburles:collection-helpers@1.1.0');
	api.use('aldeed:collection2-core@2.0.1');
	api.use('dburles:mongo-collection-instances@0.3.5');
	api.mainModule('meteor-collection-factory.js');
});

