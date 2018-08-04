'use strict';

const Homey = require('homey');

var tokens = [];
var FlowCardActionFactory = require('./lib/classes/FlowCardActionFactory.js');
var FlowCardConditionFactory = require('./lib/classes/FlowCardConditionFactory.js');
var FlowCardTriggerFactory = require('./lib/classes/FlowCardTriggerFactory.js');

class MyApp extends Homey.App {

	onInit() {

		this.log('MyApp is running...');

		Homey.ManagerSettings.on('set', this.onSettingsChanged.bind(this));

		this.onSettingsChanged("variables");

		FlowCardActionFactory.CreateFlowCardActions(tokens);
		FlowCardConditionFactory.CreateFlowCardConditions(tokens);
		FlowCardTriggerFactory.CreateFlowCardTriggers(tokens);
	}

	onSettingsChanged(parameterName)
	{
		this.log("Updating settings for: " + parameterName);

		if(parameterName === "variables")
		{
			console.log("Updating variables");

			var variables = Homey.ManagerSettings.get('variables');
			if (variables === undefined || variables === '') {
				return;
			}

			variables = JSON.parse(variables);

			for (let i in variables)
			{
				if(variables[i].type !== 'trigger')
				{
					var newVar = new Variable(this, variables[i].name, variables[i].type, variables[i].value);
					tokens.push(newVar);
				}
			}

			console.log(tokens.length + ' tokens geladen');
		}
	}


}

class Variable {
  constructor(homey, name, type, value)
	{
		this.homey = homey;
		this.id = name;
    this.name = name;
		this.type = type;
		this.value = value;
		this.token = null;
		this.registerToken();
	}

	registerToken()
	{
		this.token = new Homey.FlowToken( this.name, {
				type: this.type,
				title: this.name
			});
		this.token.register()
			.then(() => {
				return this.token.setValue( this.value );
			})
			.catch( err => {
				this.homey.error( err );
			});
	}

	update(value)
	{
		this.token.setValue(value, function (err) {
			if (err) return console.error('setValue error:', err);
		});
	}

}


module.exports = MyApp;
