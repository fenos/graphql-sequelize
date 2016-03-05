'use strict';

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

function deepMerge(a, b) {
  _Object$keys(b).forEach(function (key) {
    if (['fields', 'args'].indexOf(key) !== -1) return;

    if (a[key] && b[key]) {
      a[key] = deepMerge(a[key], b[key]);
    } else {
      a[key] = b[key];
    }
  });

  if (a.fields && b.fields) {
    a.fields = deepMerge(a.fields, b.fields);
  } else if (a.fields || b.fields) {
    a.fields = a.fields || b.fields;
  }

  return a;
}

function hasFragments(info) {
  return info.fragments && _Object$keys(info.fragments).length > 0;
}

function isFragment(info, ast) {
  return hasFragments(info) && info.fragments[ast.name.value] && ast.kind !== 'FragmentDefinition';
}

module.exports = function simplifyAST(_x, _x2, _x3) {
  var _again = true;

  _function: while (_again) {
    var ast = _x,
        info = _x2,
        parent = _x3;
    _again = false;

    var selections;
    info = info || {};

    if (ast.selectionSet) selections = ast.selectionSet.selections;
    if (Array.isArray(ast)) selections = ast;

    if (isFragment(info, ast)) {
      _x = info.fragments[ast.name.value];
      _x2 = info;
      _x3 = undefined;
      _again = true;
      selections = undefined;
      continue _function;
    }

    if (!selections) return {
      fields: {},
      args: {}
    };

    return selections.reduce(function (simpleAST, selection) {
      if (selection.kind === 'FragmentSpread' || selection.kind === 'InlineFragment') {
        simpleAST = deepMerge(simpleAST, simplifyAST(selection, info));
        return simpleAST;
      }

      var name = selection.name.value,
          alias = selection.alias && selection.alias.value,
          key = alias || name;

      simpleAST.fields[key] = simpleAST.fields[key] || {};
      simpleAST.fields[key] = deepMerge(simpleAST.fields[key], simplifyAST(selection, info, simpleAST.fields[key]));

      if (alias) {
        simpleAST.fields[key].key = name;
      }

      simpleAST.fields[key].args = selection.arguments.reduce(function (args, arg) {
        args[arg.name.value] = arg.value.value;
        return args;
      }, {});

      if (parent) {
        Object.defineProperty(simpleAST.fields[key], '$parent', { value: parent, enumerable: false });
      }

      return simpleAST;
    }, {
      fields: {},
      args: {}
    });
  }
};