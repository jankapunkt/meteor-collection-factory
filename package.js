/* eslint-env meteor */

Package.describe({
  name: 'jkuester:meteor-collection-factory',
  version: '0.1.8',
  // Brief, one-line summary of the package.
  summary: 'Factory for creating Mongo.Collection instances.',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/jankapunkt/meteor-collection-factory.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
})

Package.onUse(function (api) {
  api.versionsFrom('1.5')
  api.use('ecmascript')
  api.use('mongo')
  api.use('dburles:mongo-collection-instances@0.3.5')
  api.mainModule('meteor-collection-factory.js')
})
