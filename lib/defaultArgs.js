'use strict';

var _interopRequireWildcard = require('babel-runtime/helpers/interop-require-wildcard')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

var _typeMapper = require('./typeMapper');

var typeMapper = _interopRequireWildcard(_typeMapper);

var _typesJsonType = require('./types/jsonType');

var _typesJsonType2 = _interopRequireDefault(_typesJsonType);

module.exports = function (Model) {
  var result = {},
      key = Model.primaryKeyAttribute,
      attribute = Model.rawAttributes[key],
      type;

  if (key && attribute) {
    type = typeMapper.toGraphQL(attribute.type, Model.sequelize.constructor);
    result[key] = {
      type: type
    };
  }

  // add where
  result.where = {
    type: _typesJsonType2['default'],
    description: 'A JSON object conforming the the shape specified in http://docs.sequelizejs.com/en/latest/docs/querying/'
  };

  return result;
};