# mongoosefiller

denormalization plugin for mongoose

This plugins helps you create denormalized schemas by copying references from other collection and keeping them up to date.

## Installation

    $ npm install mongoosefiller

## Plugin options

```js
options = {
  path:  String // path to property to keep in sync with ref model
  pos:   String // positional operator prefix used to update model
  ref :  String // reference Model name (the one we copy data from)
  dest:  String // destination Model name (the one we copy data to)
  fields: Array // list of fields to copy
}
```

## Event fill

a fill event is triggered on the denormalized schema when the the ref doc change and collection is updated

```js
user.set('name', 'new-name').save();
PostSchema.on('fill', function(user) {

});

```

## Example embedded object


```js

var mongoose = require('mongoose')
  , filler = require('mongoosefiller')
  , Schema = mongoose.Schema
  , ObjectId = Schema.Types.ObjectId;

var UserSchema = new Schema({
  firstname : {type: String},
  lastname  : {type: String},
  email     : {type: String}
});

var User = mongoose.model('User', UserSchema);

var PostSchema = new Schema({
  message: {type: String}
});

var Post = mongoose.model('Post', PostSchema);

// fill path user with data from User
//update Post model every time a change occur
PostSchema.plugin(filler, {
  path: 'user',
  ref : 'User',
  dest: 'Post'
});

// save a user
var user = new User({
  firstname: 'pierre',
  lastname : 'herveou',
  email    : 'myemail@gmail.com'
});

// later save a post

Post.create({
  user: {_id: user.id},
  message: "some message"
}, function(err, post) {

  // user property are set on post doc
  console.log(post.email) // myemail@gmail.com
  console.log(post.firstname) // pierre

  // any update on user will trigger an update on the post doc
});

```

## Example embedded array

```js

var friendSchema = new Schema({
  date: {type: Date}
});

// fill friend with data from User
// update List  every time a change occur
// use 'friends.$.' positional operator to perform updates
friendSchema.plugin(filler, {
  ref       : 'User',
  dest      : 'List',
  positional: 'friends.$.'
});

var ListSchema = new Schema({
  name: {type: String},
  friends: [friendSchema]
});

var List = mongoose.model('List', ListSchema);

List.create({
  name: 'list-1',
  friends: [
    {_id: user.id, date: Date.now()}
  ]
}, function(err, list) {

  // friends property are set on friend sub doc
  console.log(list.friends[0].email) // myemail@gmail.com
  console.log(list.friends[0].firstname) // pierre

  // any update on user will trigger an update on the friend doc
});

```


## License

  MIT
