Package.describe({
  name: 'jkuester:meteor-collection-factory',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.5');
  api.use('ecmascript');
  api.use('mongo');
  api.use('aldeed:collection2-core', ['client', 'server']);
  api.use('dburles:collection-helpers', ['client', 'server']);
  api.use('dburles:mongo-collection-instances', ['client', 'server']);
  api.mainModule('meteor-collection-factory.js');
});
