'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

var _graphql = require('graphql');

var _typesJsonType = require('./types/jsonType');

var _typesJsonType2 = _interopRequireDefault(_typesJsonType);

module.exports = function () {
  return {
    limit: {
      type: _graphql.GraphQLInt
    },
    order: {
      type: _graphql.GraphQLString
    },
    where: {
      type: _typesJsonType2['default'],
      description: 'A JSON object conforming the the shape specified in http://docs.sequelizejs.com/en/latest/docs/querying/'
    }
  };
};