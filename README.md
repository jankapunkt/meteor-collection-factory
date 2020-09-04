# Archived, please use [leaonline:collection-factory](https://github.com/leaonline/collection-factory) 

## Meteor Collection Factory
Create `Mongo.Collection` instances by using a single configuration object.

[![Project Status: Active – The project has reached a stable, usable state and is being actively developed.](https://www.repostatus.org/badges/latest/active.svg)](https://www.repostatus.org/#active)
[![Build Status](https://travis-ci.org/jankapunkt/meteor-collection-factory.svg?branch=master)](https://travis-ci.org/jankapunkt/meteor-collection-factory)
![Size: Tiny](https://img.shields.io/badge/size-tiny-blue.svg)
![License - MIT](https://img.shields.io/github/license/jankapunkt/meteor-collection-factory.svg)

Compatible with (optional):

- aldeed:collection2-core + simpl-schema
- dburles:mongo-collection-instances
- dburles:burles:collection-helpers


## Changelog

0.1.9
- dropped dependency to `dburles:mongo-collection-instances`, only deps left are `ecmascript` and `mongo`
- isomorphic codebase (no server/client related execution branching)
- hooks are thus not restricted to server environment anymore
- HookNames are exported
- Renamed hooks (**may cause breaks with previous config, please refactor**)
  * insertAfter ==> afterInsert
  * updateAfter ==> afterUpdate
  * removeAfter ==> afterRemove

0.1.8
- toggle hooks (on/off)
- removed try/catch from insert/update/remove as this should be responsibility of the surrounding execution context

0.1.7
* Remove dependencies to check npm versions
* Remove SimpleSchema indirect dependency (it is totally optional now)
* Remove hard dep to dburles:burles:collection-helpers (still working optional)
* Update test code and test project to Meteor 1.8

0.1.4
* Removed internal dependency to SimpleSchemaFactory
* Included tmeasday:check-npm-versions

0.1.2
* Fixed compatibility issues with hwillson:stub-collections

## API

## createCollection

```javascript
CollectionFactory.createCollection(definitionsObject);
```

Creates a new Mongo.Collection instance by a given definitions object. 
Minimum required attribute is name.

`name:String` - The name of the collection

##### Most basic example

```javascript
const Todos = CollectionFactory.createCollection({
  name : "MY_COLLECTION_NAME",
});
```

##### Optional Attributes

The following attributes for the parameter are accepted:

`options:Object` - Mongo.Collection options
 
`schema:Object` or SimpleSchema instance - attaches the schema to the collection. If it is an object, creates a new SimpleSchema from object. See: 

`explicit:Boolean` - if true it inserts and immediately removes a temp doc to enforce explicit creation
 
`publicFields:Object` - A set of public fields as used by publications.

`helpersObj:Object` - To be used to attach helpers. See: 

##### Hooks

There are hooks for insert, update, remove, as well as afterInsert, afterUpdate, afterRemove available on server.  
 
 `insert: function(doc, callback, cb) {}`
 
 `update: function(query, modifier, options, callback) {}`
 
 `remove: function(selector, callback) {}`
 
 `afterInsert: function(doc, callback, cb, insertResult) {}`
  
 `afterUpdate: function(query, modifier, options, callback, updateResult) {}`
    
 `afterRemove: function(selector, callback, removeResult) {}`
 
 The after hooks are also called, if an error has occured. In this case the result parameter will be the error.
 Note, that the `this` context is bound to the collection itself, so use this to make use of the collection.
 
 ##### More extended example
 
 ```javascript
 const Todos = CollectionFactory.createCollection({
 	name : "todos",
 	schema: {
 		title: String,
 		createdAt: Number,
 		createdBy: String,
 		checked: {type: Boolean, defaultValue: false, },
 		description: String,
 	},
 	explicit: true,
 	publicFields: {
 		title: 1,
 		description: 1,
 		checked: 1,
 	},
 	insert:function(doc, callback, cb) {
 		doc.createdAt = new Date().getTime();
 		doc.createdBy = Meteor.userId();
 	},
 	afterUpdate: function(query, modifier, options, callback, updateResult){
 		if (updateResult) {
 			// you may log collection updates
 			Logger.log("info", "doc updated", Meteor.userId())
 			
 			// or execute actions immediately
 			const updatedDoc = this.find(query);
 			if (updatedDoc.checked){
 				//...notify creator of the todo...
 			}
 		}
 	},
 });
 ```
 
 

## hasCollection

```javascript
CollectionFactory.hasCollection('name')
```
Uses Mongo.Collection instances to check for existence. See https://github.com/dburles/mongo-collection-instances

## getCollection

```javascript
CollectionFactory.getCollection('name')
```
Has the same effect as Mongo.Collection.get('name'). See https://github.com/dburles/mongo-collection-instances

## dropCollection

```javascript
CollectionFactory.dropCollection('name')
```
Drops a collection by name.

