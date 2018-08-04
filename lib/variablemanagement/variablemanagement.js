"use strict";

const Homey = require('homey');

﻿var util = require('../util/util.js');

var newVar = '';
var tokens = [];

module.exports = {
    init: function()
    {
      var variables = getVariables();
      for (let i in variables)
      {
        var variable = variables[i];

        if (variable.type !== 'trigger')
        {
          // Make sure the label is updated every 24 hours at midnight
          let token = new Homey.FlowToken(variable.name,
          {
            type: variable.type,
            title: variable.name
          });

          token
            .register()
            .then(() => {
              this.console.log(token.name);
              //setValue(variable.value);
            })
            .catch(err => {
              this.error( err );
            });

          tokens.push(token);
        }
      };
    },
    getVariables: function() {
        return getVariables();
    },
    getVariable : function(variable) {
        return findVariable(getVariables(), variable);
    },
    updateVariable: function (variable, value, type) {
        var variables = getVariables();
        var oldVariable = findVariable(variables, variable);
        if (oldVariable) {
            variables.splice(variables.indexOf(oldVariable), 1);
        } else {
            return;
        }

        var newVariable = {
            name: variable,
            value: value,
            type: type,
            remove: oldVariable.remove,
            lastChanged: getShortDate()
        }
        variables.unshift(newVariable);

        processValueChanged(variables, oldVariable, newVariable);
    }
}

function findVariable(variables, variable) {
    return variables.filter(function (item) {return item.name === variable;})[0];
}
function processValueChanged(variables, oldVariable, newVariable) {
    console.log('processValueChanged');
    Homey.ManagerSettings.set('variables', variables);
    if (newVariable && newVariable.remove) {
        Homey.ManagerFlow
            .unregisterToken(newVariable.name,
                function callback(err) {
                    if (err) return console.error('setValue error:', err);
        });

        if(tokens == undefined)
        {
          console.log('tokens is undefined');
          return;
        }
        for (i = tokens.length - 1; i >= 0; i--) {
            if (tokens[i].id == newVariable.name) tokens.splice(i, 1);
        }
        return;
    }

    if (newVariable && !oldVariable) {
        Homey.ManagerFlow.registerToken(newVariable.name, {
            type: newVariable.type,
            title: newVariable.name
        }, function (err, token) {
            if (err) return console.error('registerToken error:', err);

            token.setValue(newVariable.value, function (err) {
                if (err) return console.error('setValue error:', err);
            });
            tokens.push(token);
        });
        return;
    }

    if (newVariable) {
        var token = tokens.find(function (dev) {
            return dev.id == newVariable.name;
        });
        if (token) {
            token.setValue(newVariable.value,
                function (err) {
                if (err) return console.error('setValue error:', err);
            });
        }
    }

    if (oldVariable && newVariable && oldVariable.value != newVariable.value) {
        Homey.ManagerFlow.trigger('if_variable_changed', { "variable" : newVariable.name, "value": newVariable.value }, newVariable);
        Homey.ManagerFlow.trigger('debug_any_variable_changed', { "variable": newVariable.name, "value": newVariable.value }, newVariable);
        Homey.ManagerFlow.trigger('if_one_of_variable_changed', { "variable" : newVariable.name, "value": newVariable.value }, newVariable);
    }

    if (newVariable && newVariable.type == 'boolean') {
        Homey.ManagerSettings.set('boolValueChanged', newVariable);
    }

    if (newVariable && newVariable.type == 'number') {
        Homey.log('-----Trigger num changed-----');
        Homey.ManagerSettings.set('numValueChanged', newVariable);
    }

    if (newVariable && newVariable.type == 'number') {
        Homey.ManagerFlow.trigger('if_number_variable_changed', { "variable" : newVariable.name, "value": newVariable.value }, {oldVariable:oldVariable, newVariable: newVariable});
    }
    if (newVariable) {
        Homey.ManagerFlow.trigger('if_variable_set', { "variable": newVariable.name, "value": newVariable.value }, newVariable);
    }
}

function logExists(variableName) {
    return insights.indexOf(variableName) > -1;
}


function getShortDate() {
    return new Date().toISOString();
}

function getVariables() {
    var varCollection = Homey.ManagerSettings.get('variables');
    if (varCollection === undefined) {
        return [];
    }
    return varCollection;
}
