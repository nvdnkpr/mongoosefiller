/**
 * module dependencies
 */

var mongoose = require('mongoose');

/**
 * references
 */

var ObjectId = mongoose.Schema.Types.ObjectId;


/**
 * @param  {Schema} schema
 * @param  {Object} options
 *
 * @api public
 */


module.exports = function (schema, options) {

  var refmodel = mongoose.model(options.ref)
    , refschema = refmodel.schema
    , rootField = {}
    , field = {}
    , root, path, positional, fields;

  // normalize options

  if (options.path) {
    root = options.path + '.';
    path = root + '_id';
  } else {
    path = '_id';
    root = '';
  }

  if (options.positional) positional = options.positional;

  // get filling fields

  if (options.fields) {
    fields = options.fields;
  } else {
    fields = Object.keys(refschema.paths)
      .filter(function (f) {return f !== '__v';});
  }

  // append fields to schema
  fields.forEach(function(name) {
    var type = refschema.paths[name].options.type;
    field[root + name] = {type: type};
    schema.add(field);
  });

  // fetch source and fill on save

  schema.pre('save', function (next) {
    var id = this.get(path)
     , self = this;

    if (!this.isNew) return next();
    if (!id) return next();

    refmodel
      .findById(id)
      .select(fields.join(' '))
      .exec(function (err, model) {
        fields.forEach(function (field) {
          self.set(root + field, model[field]);
        });
        next();
      });
  });

  // update all denormalized references when source is updated

  refschema.pre('save', function (next) {
    var self = this;

    // nothing to do for fresh doc
    if (this.isNew) return next();

    // get updated fields
    var changed = fields.filter(function (field) {
      return self.isDirectModified(field);
    });

    // nothing we care has changed
    if (!changed.length) return next();

    // build update query
    var conditions = {}
      , updates = {};

    if (positional)
      conditions[positional.replace('.$', '') + path] = this.id;
    else
      conditions[path] = this.id;

    changed.forEach(function (field) {
      if (positional)
        updates[positional + field] = self.get(field);
      else
        updates[root + field] = self.get(field);
    });

    // update
    mongoose.model(options.dest).update(conditions, updates, {multi: true}).exec();

    // call next async
    next();
  });

};