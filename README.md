[![Build Status](https://travis-ci.org/jankapunkt/meteor-collection-factory.svg?branch=master)](https://travis-ci.org/jankapunkt/meteor-collection-factory)


# Meteor Collection Factory

Creates Mongo.Collection instances according to given input. It makes use of:

- aldeed:collection2-core + simpl-schema (npm package)
- dburles:mongo-collection-instances
- dburles:burles:collection-helpers


## Changelog

0.1.4
- Removed internal dependency to SimpleSchemaFactory
- Included tmeasday:check-npm-versions

0.1.2
- Fixed compatibility issues with hwillson:stub-collections

## API


##createCollection

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

There are hooks for insert, update, remove, as well as insertAfter, updateAfter, removeAfter available on server.  
 
 `insert: function(doc, callback, cb) {}`
 
 `update: function(query, modifier, options, callback) {}`
 
 `remove: function(selector, callback) {}`
 
 `insertAfter: function(doc, callback, cb, insertResult) {}`
  
 `updateAfter: function(query, modifier, options, callback, updateResult) {}`
    
 `removeAfter: function(selector, callback, removeResult) {}`
 
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
 	updateAfter: function(query, modifier, options, callback, updateResult){
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

