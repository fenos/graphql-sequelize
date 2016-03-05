'use strict';

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

var _graphql = require('graphql');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _simplifyAST = require('./simplifyAST');

var _simplifyAST2 = _interopRequireDefault(_simplifyAST);

var _generateIncludes = require('./generateIncludes');

var _generateIncludes2 = _interopRequireDefault(_generateIncludes);

var _argsToFindOptions = require('./argsToFindOptions');

var _argsToFindOptions2 = _interopRequireDefault(_argsToFindOptions);

var _relay = require('./relay');

function inList(list, attribute) {
  return ~list.indexOf(attribute);
}

function resolverFactory(target, options) {
  var resolver,
      targetAttributes,
      isModel = !!target.getTableName,
      isAssociation = !!target.associationType,
      association = isAssociation && target,
      model = isAssociation && target.target || isModel && target;

  targetAttributes = _Object$keys(model.rawAttributes);

  options = options || {};
  if (options.include === undefined) options.include = true;
  if (options.before === undefined) options.before = function (options) {
    return options;
  };
  if (options.after === undefined) options.after = function (result) {
    return result;
  };
  if (options.handleConnection === undefined) options.handleConnection = true;
  if (options.filterAttributes === undefined) options.filterAttributes = resolverFactory.filterAttributes;

  resolver = function (source, args, info) {
    var root = info.rootValue || {},
        ast = info.fieldASTs,
        type = info.returnType,
        list = options.list || type instanceof _graphql.GraphQLList,
        includeResult,
        simpleAST = (0, _simplifyAST2['default'])(ast[0], info),
        fields = simpleAST.fields,
        findOptions = (0, _argsToFindOptions2['default'])(args, model);

    if ((0, _relay.isConnection)(info.returnType)) {
      simpleAST = (0, _relay.nodeAST)(simpleAST);
      fields = simpleAST.fields;

      type = (0, _relay.nodeType)(type);
    }

    type = type.ofType || type;

    if (association && source.get(association.as) !== undefined) {
      if (options.handleConnection && (0, _relay.isConnection)(info.returnType)) {
        return (0, _relay.handleConnection)(source.get(association.as), args);
      }

      return options.after(source.get(association.as), args, root, {
        ast: simpleAST,
        type: type,
        source: source
      });
    }

    if (options.filterAttributes) {
      findOptions.attributes = _Object$keys(fields).map(function (key) {
        return fields[key].key || key;
      }).filter(inList.bind(null, targetAttributes));
    } else {
      findOptions.attributes = targetAttributes;
    }

    if (model.primaryKeyAttribute) {
      findOptions.attributes.push(model.primaryKeyAttribute);
    }

    includeResult = (0, _generateIncludes2['default'])(simpleAST, type, root, options);

    findOptions.include = includeResult.include;
    if (includeResult.order) {
      findOptions.order = (findOptions.order || []).concat(includeResult.order);
    }
    findOptions.attributes = _lodash2['default'].uniq(findOptions.attributes.concat(includeResult.attributes));

    findOptions.root = root;
    findOptions.logging = findOptions.logging || root.logging;

    findOptions = options.before(findOptions, args, root, {
      ast: simpleAST,
      type: type,
      source: source
    });

    if (!findOptions.order) {
      findOptions.order = [model.primaryKeyAttribute, 'ASC'];
    }

    if (association) {
      return source[association.accessors.get](findOptions).then(function (result) {
        if (options.handleConnection && (0, _relay.isConnection)(info.returnType)) {
          result = (0, _relay.handleConnection)(result, args);
        }
        return options.after(result, args, root, {
          ast: simpleAST,
          type: type,
          source: source
        });
      });
    }

    return model[list ? 'findAll' : 'findOne'](findOptions).then(function (result) {
      return options.after(result, args, root, {
        ast: simpleAST,
        type: type,
        source: source
      });
    });
  };

  if (association) {
    resolver.$association = association;
  }

  resolver.$before = options.before;
  resolver.$after = options.after;
  resolver.$options = options;

  return resolver;
}

resolverFactory.filterAttributes = true;

module.exports = resolverFactory;