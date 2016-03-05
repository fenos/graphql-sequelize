'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _extends = require('babel-runtime/helpers/extends')['default'];

var _defineProperty = require('babel-runtime/helpers/define-property')['default'];

var _slicedToArray = require('babel-runtime/helpers/sliced-to-array')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.idFetcher = idFetcher;
exports.typeResolver = typeResolver;
exports.isConnection = isConnection;
exports.handleConnection = handleConnection;
exports.sequelizeNodeInterface = sequelizeNodeInterface;
exports.nodeAST = nodeAST;
exports.nodeType = nodeType;
exports.sequelizeConnection = sequelizeConnection;

var _graphqlRelay = require('graphql-relay');

var _graphql = require('graphql');

var _base64Js = require('./base64.js');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _simplifyAST = require('./simplifyAST');

var _simplifyAST2 = _interopRequireDefault(_simplifyAST);

var NodeTypeMapper = (function () {
  function NodeTypeMapper(sequelize) {
    var _this = this;

    _classCallCheck(this, NodeTypeMapper);

    this.models = _Object$keys(sequelize.models);
    this.models.forEach(function (model) {
      _this[model] = null;
    });
  }

  _createClass(NodeTypeMapper, [{
    key: 'mapTypes',
    value: function mapTypes(types) {
      var _this2 = this;

      _Object$keys(types).forEach(function (type) {
        _this2[type] = types[type];
      });
    }
  }]);

  return NodeTypeMapper;
})();

function idFetcher(sequelize, nodeTypeMapper) {
  return function (globalId) {
    var _fromGlobalId = (0, _graphqlRelay.fromGlobalId)(globalId);

    var type = _fromGlobalId.type;
    var id = _fromGlobalId.id;

    var models = _Object$keys(sequelize.models);
    if (models.some(function (model) {
      return model === type;
    })) {
      return sequelize.models[type].findById(id);
    }
    if (nodeTypeMapper[type]) {
      return nodeTypeMapper[type];
    }
    return null;
  };
}

function typeResolver(nodeTypeMapper) {
  return function (obj) {
    var name = obj.Model ? obj.Model.options.name.singular : obj.name;

    return nodeTypeMapper[name];
  };
}

function isConnection(type) {
  return typeof type.name !== 'undefined' && type.name.endsWith('Connection');
}

function handleConnection(values, args) {
  return (0, _graphqlRelay.connectionFromArray)(values, args);
}

function sequelizeNodeInterface(sequelize) {
  var nodeTypeMapper = new NodeTypeMapper(sequelize);
  var nodeObjects = (0, _graphqlRelay.nodeDefinitions)(idFetcher(sequelize, nodeTypeMapper), typeResolver(nodeTypeMapper));

  return _extends({
    nodeTypeMapper: nodeTypeMapper
  }, nodeObjects);
}

function nodeAST(connectionAST) {
  return connectionAST.fields.edges && connectionAST.fields.edges.fields.node;
}

function nodeType(connectionType) {
  return connectionType._fields.edges.type.ofType._fields.node.type;
}

function sequelizeConnection(_ref3) {
  var name = _ref3.name;
  var nodeType = _ref3.nodeType;
  var target = _ref3.target;
  var orderByEnum = _ref3.orderBy;
  var _before = _ref3.before;
  var connectionFields = _ref3.connectionFields;
  var edgeFields = _ref3.edgeFields;
  var where = _ref3.where;

  var _connectionDefinitions = (0, _graphqlRelay.connectionDefinitions)({
    name: name,
    nodeType: nodeType,
    connectionFields: connectionFields,
    edgeFields: edgeFields
  });

  var edgeType = _connectionDefinitions.edgeType;
  var connectionType = _connectionDefinitions.connectionType;

  var model = target.target ? target.target : target;
  var SEPERATOR = '$';
  var PREFIX = 'arrayconnection' + SEPERATOR;

  if (orderByEnum === undefined) {
    orderByEnum = new _graphql.GraphQLEnumType({
      name: name + 'ConnectionOrder',
      values: {
        ID: { value: [model.primaryKeyAttribute, 'ASC'] }
      }
    });
  }

  var defaultOrderBy = orderByEnum._values[0].value;

  _before = _before || function (options) {
    return options;
  };

  var $connectionArgs = _extends({}, _graphqlRelay.connectionArgs, {
    orderBy: {
      type: new _graphql.GraphQLList(orderByEnum)
    }
  });

  var orderByAttribute = function orderByAttribute(orderBy) {
    return orderBy[0][0];
  };

  var toCursor = function toCursor(value, orderBy) {
    var id = value.get(model.primaryKeyAttribute);
    var orderValue = value.get(orderByAttribute(orderBy));
    return (0, _base64Js.base64)(PREFIX + id + SEPERATOR + orderValue);
  };

  var fromCursor = function fromCursor(cursor) {
    cursor = (0, _base64Js.unbase64)(cursor);
    cursor = cursor.substring(PREFIX.length, cursor.length);

    var _cursor$split = cursor.split(SEPERATOR);

    var _cursor$split2 = _slicedToArray(_cursor$split, 2);

    var id = _cursor$split2[0];
    var orderValue = _cursor$split2[1];

    return {
      id: id,
      orderValue: orderValue
    };
  };

  var argsToWhere = function argsToWhere(args) {
    var result = {};

    _lodash2['default'].each(args, function (value, key) {
      if (key in $connectionArgs) return;
      _lodash2['default'].assign(result, where(key, value));
    });

    return result;
  };

  var resolveEdge = function resolveEdge(item, args, source) {
    if (args === undefined) args = {};

    if (!args.orderBy) {
      args.orderBy = [defaultOrderBy];
    }

    return {
      cursor: toCursor(item, args.orderBy),
      node: item,
      source: source
    };
  };

  var $resolver = require('./resolver')(target, {
    handleConnection: false,
    include: true,
    list: true,
    before: function before(options, args, root, context) {
      if (args.first || args.last) {
        options.limit = parseInt(args.first || args.last, 10);
      }

      if (!args.orderBy) {
        args.orderBy = [orderByEnum._values[0].value];
      } else if (typeof args.orderBy === 'string') {
        args.orderBy = [orderByEnum._nameLookup[args.orderBy].value];
      }

      var orderBy = args.orderBy;
      var orderAttribute = orderByAttribute(orderBy);
      var orderDirection = args.orderBy[0][1];

      if (args.last) {
        orderDirection = orderDirection === 'ASC' ? 'DESC' : 'ASC';
      }

      options.order = [[orderAttribute, orderDirection]];

      if (orderAttribute !== model.primaryKeyAttribute) {
        options.order.push([model.primaryKeyAttribute, 'ASC']);
      }

      options.attributes.push(orderAttribute);

      if (model.sequelize.dialect.name === 'postgres' && options.limit) {
        options.attributes.push([model.sequelize.literal('COUNT(*) OVER()'), 'full_count']);
      }

      options.where = argsToWhere(args);
      options.required = false;

      if (args.after || args.before) {
        var _ref2;

        var cursor = fromCursor(args.after || args.before);
        var orderValue = cursor.orderValue;

        if (model.rawAttributes[orderAttribute].type instanceof model.sequelize.constructor.DATE) {
          orderValue = new Date(orderValue);
        }

        var slicingWhere = {
          $or: [_defineProperty({}, orderAttribute, _defineProperty({}, orderDirection === 'ASC' ? '$gt' : '$lt', orderValue)), (_ref2 = {}, _defineProperty(_ref2, orderAttribute, {
            $eq: orderValue
          }), _defineProperty(_ref2, model.primaryKeyAttribute, {
            $gt: cursor.id
          }), _ref2)]
        };

        // TODO, do a proper merge that won't kill another $or
        _lodash2['default'].assign(options.where, slicingWhere);
      }

      // apply uniq to the attributes
      options.attributes = _lodash2['default'].uniq(options.attributes);

      return _before(options, args, root, context);
    },
    after: function after(values, args, root, _ref4) {
      var source = _ref4.source;

      var edges = values.map(function (value) {
        return resolveEdge(value, args, source);
      });

      var firstEdge = edges[0];
      var lastEdge = edges[edges.length - 1];
      var fullCount = values[0] && values[0].dataValues.full_count && parseInt(values[0].dataValues.full_count, 10);

      if (!values[0]) {
        fullCount = 0;
      }
      if (model.sequelize.dialect.name === 'postgres' && (args.first || args.last)) {
        if (fullCount === null || fullCount === undefined) throw new Error('No fullcount available');
      }

      return {
        source: source,
        args: args,
        where: argsToWhere(args),
        edges: edges,
        pageInfo: {
          startCursor: firstEdge ? firstEdge.cursor : null,
          endCursor: lastEdge ? lastEdge.cursor : null,
          hasPreviousPage: args.last !== null && args.last !== undefined ? fullCount > parseInt(args.last, 10) : false,
          hasNextPage: args.first !== null && args.first !== undefined ? fullCount > parseInt(args.first, 10) : false
        }
      };
    }
  });

  var resolver = function resolver(source, args, info) {
    if ((0, _simplifyAST2['default'])(info.fieldASTs[0], info).fields.edges) {
      return $resolver(source, args, info);
    }

    return {
      source: source,
      args: args,
      where: argsToWhere(args)
    };
  };

  resolver.$association = $resolver.$association;
  resolver.$before = $resolver.$before;
  resolver.$after = $resolver.$after;
  resolver.$options = $resolver.$options;

  return {
    connectionType: connectionType,
    edgeType: edgeType,
    nodeType: nodeType,
    resolveEdge: resolveEdge,
    connectionArgs: $connectionArgs,
    resolve: resolver
  };
}