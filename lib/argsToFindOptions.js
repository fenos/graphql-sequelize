'use strict';

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = argsToFindOptions;

var _replaceWhereOperators = require('./replaceWhereOperators');

function argsToFindOptions(args, target) {
  var result = {},
      targetAttributes = _Object$keys(target.rawAttributes);

  if (args) {
    _Object$keys(args).forEach(function (key) {
      if (~targetAttributes.indexOf(key)) {
        result.where = result.where || {};
        result.where[key] = args[key];
      }

      if (key === 'limit' && args[key]) {
        result.limit = args[key];
      }

      if (key === 'offset' && args[key]) {
        result.offset = args[key];
      }

      if (key === 'order' && args[key]) {
        if (args[key].indexOf('reverse:') === 0) {
          result.order = [[args[key].substring(8), 'DESC']];
        } else {
          result.order = [[args[key], 'ASC']];
        }
      }

      if (key === 'where' && args[key]) {
        // setup where
        result.where = (0, _replaceWhereOperators.replaceWhereOperators)(args.where);
      }
    });
  }

  return result;
}

module.exports = exports['default'];