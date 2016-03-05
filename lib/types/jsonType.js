'use strict';

var _defineProperty = require('babel-runtime/helpers/define-property')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _astToJson;

var _graphql = require('graphql');

var _graphqlLanguage = require('graphql/language');

var astToJson = (_astToJson = {}, _defineProperty(_astToJson, _graphqlLanguage.Kind.INT, function (ast) {
  return _graphql.GraphQLInt.parseLiteral(ast);
}), _defineProperty(_astToJson, _graphqlLanguage.Kind.FLOAT, function (ast) {
  return _graphql.GraphQLFloat.parseLiteral(ast);
}), _defineProperty(_astToJson, _graphqlLanguage.Kind.BOOLEAN, function (ast) {
  return _graphql.GraphQLBoolean.parseLiteral(ast);
}), _defineProperty(_astToJson, _graphqlLanguage.Kind.STRING, function (ast) {
  return _graphql.GraphQLString.parseLiteral(ast);
}), _defineProperty(_astToJson, _graphqlLanguage.Kind.ENUM, function (ast) {
  return String(ast.value);
}), _defineProperty(_astToJson, _graphqlLanguage.Kind.LIST, function (ast) {
  return ast.values.map(function (astItem) {
    return JSONType.parseLiteral(astItem);
  });
}), _defineProperty(_astToJson, _graphqlLanguage.Kind.OBJECT, function (ast) {
  var obj = {};
  ast.fields.forEach(function (field) {
    obj[field.name.value] = JSONType.parseLiteral(field.value);
  });
  return obj;
}), _astToJson);

var JSONType = new _graphql.GraphQLScalarType({
  name: 'JSON',
  description: 'The `JSON` scalar type represents raw JSON as values.',
  serialize: function serialize(value) {
    return value;
  },
  parseValue: function parseValue(value) {
    return value;
  },
  parseLiteral: function parseLiteral(ast) {
    var parser = astToJson[ast.kind];
    return parser ? parser.call(undefined, ast) : null;
  }
});

exports['default'] = JSONType;
module.exports = exports['default'];