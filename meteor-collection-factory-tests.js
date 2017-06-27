// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by meteor-collection-factory.js.
import { name as packageName } from "meteor/jkuester:meteor-collection-factory";

// Write your tests here!
// Here is an example.
Tinytest.add('meteor-collection-factory - example', function (test) {
  test.equal(packageName, "meteor-collection-factory");
});
