var Tracker = Tracker || (function () {
	'use strict';

	const ALL_STATUSES = ["red", "blue", "green", "brown", "purple", "pink", "yellow",
			"dead", "skull", "sleepy", "half-heart", "half-haze", "interdiction", "snail", "lightning-helix", "spanner",
			"chained-heart", "chemical-bolt", "death-zone", "drink-me", "edge-crack", "ninja-mask", "stopwatch",
			"fishing-net", "overdrive", "strong", "fist", "padlock", "three-leaves", "fluffy-wing", "pummeled", "tread",
			"arrowed", "aura", "back-pain", "black-flag", "bleeding-eye", "bolt-shield", "broken-heart", "cobweb",
			"broken-shield", "flying-flag", "radioactive", "trophy", "broken-skull", "frozen-orb", "rolling-bomb",
			"white-tower", "grab", "screaming", "grenade", "sentry-gun", "all-for-one", "angel-outfit", "archery-target"
		],

		STATUS_ALIASES = {
			'crippled': "arrowed",
			'helpless': "cobweb",
			'pinned': "flying-flag",
			'prone': "back-pain",
			'frenzied': "strong",
			'stunned': "pummeled",
			'unaware': "half-haze",
			'hidden': "ninja-mask",
			'aiming': "archery-target",
			'braced': "sentry gun",
			'defensive': "white-tower",
			'guarded': "bolt-shield",
			'overwatch': "all-for-one",
			'inspired': "trophy",
			'hallucinating': "aura",
			'haywire': "spanner",
			'bloodloss': "half-haze",
			'blinded': "bleeding-eye",
			'deafened': "lightning-helix",
			'fire': "three-leaves",
			'engaged': "fist",
			'grabbed': "grab",
			'feared': "screaming",
			'unconscious': "sleepy",
			'uselesslimb': "broken-skull",
			'criticallywounded': "broken-heart",
			'heavilywounded': "half-heart",
			'lightlywounded': "chained-heart",
			'prone': "tread",
			'fullaim': "frozen-orb",
			'alloutatk': "overdrive",
			'majinitpenalty': "yellow",
			'lginitpenalty': "half-haze",
			'initpenalty': "pink",
			'mininitpenalty': "purple",
			'mininitbonus': "green",
			'initbonus': "blue",
			'lginitbonus': "brown",
			'majinitbonus': "red"
		},

		//TODO: test the alias/status utility fcns
		INITIATIVE_MOD = {
			'unconscious': -100,
			'helpless': -20,
			'stunned': -20,
			'majinitpenalty': -20,
			'feared': -15,
			'pinned': -15,
			'fire': -15,
			'lrginitpenalty': -15,
			'grabbed': -10,
			'alloutatk': -10,
			'initpenalty': -10,
			'crippled': -5,
			'prone': -5,
			'blinded': -5,
			'deafened': -5,
			'heavilywounded': -5,
			'mininitpenalty': -5,
			'aiming': 5,
			'mininitbonus': 5,
			'guarded': 10,
			'fullaim': 10,
			'initbonus': 10,
			'lginitbonus': 15,
			'defensive': 20,
			'majinitbonus': 20
		},

		//for use with the complex status handler; sets status aliases to either persistent, rounds, or round
		STATUS_TYPES = {
			'crippled': "persistent",
			'helpless': "persistent",
			'pinned': "persistent",
			'prone': "persistent",
			'frenzied': "persistent",
			'stunned': "rounds",
			'unaware': "round",
			'hidden': "persistent",
			'aiming': "round",
			'braced': "persistent",
			'defensive': "round",
			'guarded': "round",
			'overwatch': "round",
			'inspired': "round",
			'hallucinating': "rounds",
			'haywire': "rounds",
			'bloodloss': "persistent",
			'blinded': "rounds",
			'deafened': "rounds",
			'fire': "rounds",
			'engaged': "persistent",
			'grabbed': "persistent",
			'feared': "round",
			'unconscious': "persistent",
			'uselesslimb': "rounds",
			'criticallywounded': "persistent",
			'heavilywounded': "persistent",
			'lightlywounded': "persistent",
			'prone': "persistent",
			'fullaim': "round",
			'alloutatk': "round",
			'majinitpenalty': "round",
			'lginitpenalty': "round",
			'initpenalty': "round",
			'mininitpenalty': "round",
			'mininitbonus': "round",
			'initbonus': "round",
			'lginitbonus': "round",
			'majinitbonus': "round"
		},

		//TODO: Build the code for the wh40ksheet, wh40krollscripts
		CONFIG_PARAMS = [
			['announceRounds', "Announce Each Round"],
			['announceTurns', "Announce Each Player's Turn"],
			['announceExpiration', "Announce Status Expirations"],
			['highToLow', "High-to-Low Initiative Order"],
			['pooledInit', "Pooled Mook Initiative Rolls"],
			['dynamicInit', "Dynamic Initiative"],
			['statusTurn', "Status Updated on Turn or Round"],
			['wh40ksheet', "using Args WH40k sheet"],
			['wh40krollscripts', "using Args WH40k scripts"],
			['autoremovedead', "automatically remove dead tokens"],
			['complexstatushandler', "handles status markers differently"]
		];

	let initConfig = function initConfig() {
			if (!state.hasOwnProperty('InitiativeTracker')) {
				state.InitiativeTracker = {
					'highToLow': true,
					'announceRounds': true,
					'announceTurns': true,
					'announceExpiration': true,
					'pooledInit': true,
					'dynamicInit': true,
					'statusTurn': true,
					'wh40ksheet': true,
					'wh40krollscripts': true,
					'autoremovedead': true,
					'complexstatushandler': true,
				};
			}
			if (!state.InitiativeTracker.hasOwnProperty('round')) {
				sendChat('', "the initiative tracker needs a token:" + state.InitiativeTracker.toString());
				state.InitiativeTracker.round = null;
			}
			if (!state.InitiativeTracker.hasOwnProperty('count')) {
				sendChat('', "the initiative tracker needs a token:" + state.InitiativeTracker.toString());
				state.InitiativeTracker.count = null;
			}
			if (!state.InitiativeTracker.hasOwnProperty('token')) {
				sendChat('', "the initiative tracker needs a token:" + state.InitiativeTracker.toString());
				state.InitiativeTracker.token = {};
			}
		},

		write = function (s, who, style, from) {
			if (who) {
				who = "/w " + who.split(" ", 1)[0] + " ";
			}
			sendChat(from, who + s.replace(/</g, "<").replace(/>/g, ">").replace(/\n/g, "<br>"));
		},

		reset = function () {
			state.InitiativeTracker.round = null;
			state.InitiativeTracker.count = null;
			state.InitiativeTracker.token = {};
		},

		dataSync = function () {
			//Rebuilds the "back end" to match the current tokens and status markers on the map. Does not reset the initiative order AND also doesn't sync the current init of mooks and generics
			let oldTurnOrderStr = Campaign().get('turnorder') || "[]";
			let turnOrder = JSON.parse(oldTurnOrderStr);
			let tokenid, turn, expires, tokenInit, nextInitiative, statusname, alias;
			let tokenStatusStr = '';
			let tokenStatusArr = [];
			let statusArr = [];
			let currentPageGraphics = findObjs({
				_pageid: Campaign().get("playerpageid"),
				_type: "graphic",
				_subtype: "token",
			});

			state.InitiativeTracker.token = {};

			_.each(currentPageGraphics, function (selToken) {
				if (selToken.get('bar3_value') != '' && (state.InitiativeTracker['autoremovedead'] === false || !selToken.get('statusmarkers').includes('dead'))) {
					//get a qualifying token and find a matching entry in the initiative order to get its init
					tokenid = selToken.get('id');
					nextInitiative = 0;
					statusArr = [];

					//get token's status markers and build the status array
					tokenStatusStr = selToken.get('statusmarkers');
					tokenStatusArr = tokenStatusStr.split(',');
					if (tokenStatusArr[0] != '' && tokenStatusArr[0] != undefined) {
						_.each(tokenStatusArr, function (selStatus) {
							statusname = selStatus.split('@')[0];
							if (statusname != '' && statusname != undefined) {
								if (selStatus.split('@')[1]) expires = selStatus.split('@')[1];
								else expires = 999;
								alias = _.invert(STATUS_ALIASES)[statusname];
								if (!alias) alias = '';
								if (INITIATIVE_MOD[alias]) nextInitiative += INITIATIVE_MOD[alias];
								else if (INITIATIVE_MOD[statusname]) nextInitiative += INITIATIVE_MOD[statusname];
								statusArr.push({
									'duration': expires,
									'count': state.InitiativeTracker.count,
									'name': statusname,
									'alias': alias,
									'severity': 0,
								});
							}
						});
					}

					//assign initiative values; uniques get their value from the turn order, generics and mooks get assigned a current init equal to their next-turn init
					turn = turnOrder.find(function (o) {
						return o.id === tokenid;
					});
					if (turn != undefined) tokenInit = turnOrder[turn.id];
					else tokenInit = nextInitiative;

					//fully set the entry for the token
					state.InitiativeTracker.token[tokenid] = {
						initiative: tokenInit,
						nextInitiative: nextInitiative,
						name: selToken.get('name'),
						statuses: statusArr,
						expiredStatuses: []
					};
				}
			});
		},

		getInitModFromAliasOrStatus = function (name) {
			//utility function that takes a status name or status alias and searches the initiative list for both. Returns an init mod of 0 if the name doesn't match a status or alias
			let output;
			if (INITIATIVE_MOD[name]) {
				output = INITIATIVE_MOD[name];
				return output;
			}
			//if we don't get a name match, try looking for a paired status or alias and try again
			if (STATUS_ALIASES[name]) name = STATUS_ALIASES[name];
			else if (_.invert(STATUS_ALIASES)[name]) name = _.invert(STATUS_ALIASES)[name];

			if (INITIATIVE_MOD[name]) output = INITIATIVE_MOD[name];
			else output = 0;

			return output;
		},

		getAliasOrName = function (status) {
			//utility function that, given a status object, returns the alias (if it has one) or, in the absence of an alias, the status name (if it has one)
			let output;
			if (status.alias != undefined) output = status.alias;
			else if (status.name != undefined) output = status.name;
			else output = 'unknown';
			return output;
		},

		stackTokenSync = function (id) {
			//utility function that checks for a token object with a given id and builds one if missing
			if (!state.InitiativeTracker.token[id]) {
				let name = getObj("graphic", id).get('name');
				if (!name) name = 'unknown';
				state.InitiativeTracker.token[id] = {
					initiative: 0,
					nextInitiative: 0,
					name: name,
					statuses: [],
					expiredStatuses: []
				};
			}
		},

		announceRound = function (round) {
			if (!state.InitiativeTracker.announceRounds) {
				return;
			}
			sendChat("", "/desc Start of Round " + round);
		},

		announceTurn = function (count, tokenName, tokenId) {
			if (!state.InitiativeTracker.announceTurns) {
				return;
			}
			if (!tokenName) {
				var token = getObj("graphic", tokenId);
				if (token) {
					tokenName = token.get('name');
				}
			}
			sendChat("", "/desc Start of Turn " + state.InitiativeTracker.round + " for " + tokenName + " (" + count + ")");
		},

		announceStatusExpiration = function (status, tokenName) {
			if (!state.InitiativeTracker.announceExpiration) {
				return;
			}
			sendChat("", "/desc Status " + status + " expired on " + tokenName);
		},

		handleTurnChange = function (newTurnOrder, oldTurnOrder) {
			var newTurns = JSON.parse((typeof (newTurnOrder) == typeof ("") ? newTurnOrder : newTurnOrder.get('turnorder') || "[]"));
			var oldTurns = JSON.parse((typeof (oldTurnOrder) == typeof ("") ? oldTurnOrder : oldTurnOrder.turnorder || "[]"));
			//log(newTurns);
			//log(oldTurns);
			if ((!newTurns) || (!oldTurns)) {
				return;
			}

			if ((newTurns.length == 0) && (oldTurns.length > 0)) {
				return reset();
			} // turn order was cleared; reset

			if ((!newTurns.length) || (newTurns.length != oldTurns.length)) {
				return;
			} // something was added or removed; ignore

			if ((state.InitiativeTracker.round == null) || (state.InitiativeTracker.count == null)) {
				// first change: see if it's time to start tracking
				var startTracking = false;
				for (var i = 0; i < newTurns.length; i++) {
					if (newTurns[i].id != oldTurns[i].id) {
						// turn order was sorted; start tracking
						startTracking = true;
						break;
					}
					if (newTurns[i].pr != oldTurns[i].pr) {
						break;
					} // a token's initiative count was changed; don't start tracking yet
				}
				if (!startTracking) {
					return;
				}
				state.InitiativeTracker.round = 1;
				state.InitiativeTracker.count = newTurns[0].pr;
				announceRound(state.InitiativeTracker.round);
				announceTurn(newTurns[0].pr, newTurns[0].custom, newTurns[0].id);
				return;
			}

			if (newTurns[0].id == oldTurns[0].id) {
				return;
			} // turn didn't change


			var newCount = newTurns[0].pr;
			var oldCount = state.InitiativeTracker.count;
			if (!state.InitiativeTracker.highToLow) {
				// use negatives for low-to-high initiative so inequalities work out the same as high-to-low
				newCount = -newCount;
				oldCount = -oldCount;
			}

			var roundChanged = newCount > oldCount;

			//if status markers are set to update every turn...do that
			if (state.InitiativeTracker['statusTurn'] === true) {

				//Adjust statuses for the token whose turn just ended (the previous token)
				if (newTurns[newTurns.length - 1].id != -1) {
					var currentToken = getObj("graphic", newTurns[newTurns.length - 1].id);
					//create a new token entry if necessary
					stackTokenSync(newTurns[newTurns.length - 1].id);
					var currentStackToken = state.InitiativeTracker.token[newTurns[newTurns.length - 1].id];
					var characterName = currentToken.get('name');
					var matchingTokens = findObjs({
						_pageid: Campaign().get("playerpageid"),
						_type: "graphic",
						_subtype: "token",
						name: characterName
					});

					//find all tokens that match a given character name
					_.each(matchingTokens, function (selToken) {

						//Tracker.stackTokenSync(selToken.id);
						stackTokenSync(selToken.id);
						var selStackToken = state.InitiativeTracker.token[selToken.id];
						if (selStackToken.initiative == currentStackToken.initiative) {
							selStackToken.expiredStatuses = [];
							for (var i = 0; i < selStackToken.statuses.length; i++) {
								var selStatus = selStackToken.statuses[i];
								selStatus.duration--;
								if (selStatus.duration <= 0) {
									selToken.set("status_" + selStatus.name, false);
									selStackToken.nextInitiative -= getInitModFromAliasOrStatus(getAliasOrName(selStatus));
									announceStatusExpiration(getAliasOrName(selStatus), selToken.get('name'));
									selStackToken.expiredStatuses.push(selStackToken.statuses.splice(i, 1)[0]);
									log("the expired status stack has: " + selStackToken.expiredStatuses[selStackToken.expiredStatuses.length - 1].name + "on the stack")
									i -= 1;
								} else if (selStatus.duration < 10) {
									// status has nine or fewer rounds left; update marker to reflect remaining rounds
									selToken.set("status_" + selStatus.name, selStatus.duration);
								}

							}
						}
					});
				}
			}
			if (roundChanged) {
				handleRoundChange();
			}

			//Look ahead and see if the next turn will have a round change TODO: adjust for no dynamic init
			if (state.InitiativeTracker['dynamicInit'] === true && ((newTurns[0].pr < newTurns[1].pr && state.InitiativeTracker['highToLow']) || (newTurns[0].pr > newTurns[1].pr && !state.InitiativeTracker['highToLow']))) {
				Tracker.oldRoundOrder = Campaign().get('turnorder') || "[]";
				log("Latched turn order str: " + Tracker.oldRoundOrder);
			}

			state.InitiativeTracker.count = newTurns[0].pr;
			announceTurn(newTurns[0].pr, newTurns[0].custom, newTurns[0].id);
		},

		handleRoundChange = function () {
			state.InitiativeTracker.round += 1;
			announceRound(state.InitiativeTracker.round);

			//Dynamic Init hook: find all the tokens on the map and reroll their initiative
			if (state.InitiativeTracker['dynamicInit'] === true) {
				var charid = '';
				var tokenid = '';
				var matchingCharacters = {}; //tracks character sheets with the same character name as a token's name
				var initBonus = 0;
				var roll = 0;
				var usedCharArray = []; //tracks the charids that have already been rolled for
				var turnorder = [];
				var oldstack = [];
				var newEntry = {};
				var rollArray = {};
				var duplicateInit = false;
				var page_id = '';
				var exists = false;
				var stackToken = {};
				var adjRollArray = [];
				var stackTokenInit = 0;
				var characterName;
				var currentPageGraphics = findObjs({
					_pageid: Campaign().get("playerpageid"),
					_type: "graphic",
					_subtype: "token",
				});
				if (currentPageGraphics.length != 0) {
					page_id = currentPageGraphics[0].get('pageid');
				}

				//Set up the Round Start entry if using dynamic initiative
				if (state.InitiativeTracker['highToLow'] === true) {
					turnorder.push({
						id: "-1",
						pr: 100,
						custom: "Round Start",
						_pageid: page_id
					});
				} else {
					turnorder.push({
						id: "-1",
						pr: -100,
						custom: "Round Start",
						_pageid: page_id
					});
				}

				_.each(currentPageGraphics, function (graphic) {
					tokenid = graphic.get('id');
					//only check tokens which have bar3 values and--if autoremove is enabled-- are not dead (are character tokens of some kind)
					if (graphic.get('bar3_value') != '' && (state.InitiativeTracker['autoremovedead'] === false || !graphic.get('statusmarkers').includes('dead'))) {
						if (state.InitiativeTracker['statusTurn'] === false) {
							var selStackToken = state.InitiativeTracker.token[tokenid];
							selStackToken.expiredStatuses = [];
							_.each(selStackToken.statuses, function (selStatus, index) {
								selStatus.duration--;
								if (selStatus.duration <= 0) {
									graphic.set("status_" + selStatus.name, false);
									selStackToken.nextInitiative -= getInitModFromAliasOrStatus(Tracker.getAliasOrName(selStatus));
									announceStatusExpiration(getAliasOrName(selStatus), graphic.get('name'));
									selStackToken.expiredStatuses.push(selStackToken.statuses.splice(i, 1)[0]);
								} else if (selStatus.duration < 10) {
									// status has nine or fewer rounds left; update marker to reflect remaining rounds
									graphic.set("status_" + selStatus.name, selStatus.duration);
								}
							});
						}
						exists = false;

						//synchronize the init tracker stucture with the extant tokens
						stackTokenSync(tokenid);
						stackToken = state.InitiativeTracker.token[tokenid];
						stackToken.initiative = stackToken.nextInitiative;
						stackTokenInit = stackToken.initiative;

						//check to see if the token is linked to a character
						charid = graphic.get('represents');
						if (charid != undefined && charid != '') {

							//if the token represents a character we handle it uniquely
							initBonus = getAttrByName(charid, "AgilityMod", "current");

							//TODO: eventually, we want linked characters to have their initiative modifier reflected in the character sheet
							roll = randomInteger(10) + parseInt(initBonus);
						} else {

							//if there's no linked char, see if we can find any characters with the exact same name as the token
							characterName = graphic.get('name');
							matchingCharacters = findObjs({
								_type: "character",
								name: characterName,
							});
							if (matchingCharacters.length == 0) {
								//generic tokens with no matching character get a generic roll
								initBonus = 0;
								roll = randomInteger(10);
							} else {

								//if there's a matching character but the token isn't directly linked then the character is a mook
								charid = matchingCharacters[0].get('id');
								if (state.InitiativeTracker['pooledInit'] === true) {
									exists = !usedCharArray.every(function (used) {
										return used !== charid;
									});
								}
								if (exists === false) {

									//handles first instance of a mook
									initBonus = getAttrByName(charid, "AgilityMod", "current");
									roll = randomInteger(10) + parseInt(initBonus);

									rollArray[charid] = roll;
									usedCharArray.push(charid);
								} else {

									//handles subsequent instances of a mook
									initBonus = getAttrByName(charid, "AgilityMod", "current");
									roll = rollArray[charid];
								}
							}
						}

						//add any status-based initiative modifications
						roll += parseInt(stackTokenInit);
						if (charid) {
							duplicateInit = _.some(adjRollArray[charid], function (value) {
								return value === roll;
							});
							if (exists === false) adjRollArray[charid] = [];
							if (duplicateInit === false) adjRollArray[charid].push(roll);
						}

						//place in ordered turnorder array IF the character hasn't already been added OR the character is a mook with an adjusted initiative value
						if (exists === false || (exists === true && duplicateInit === false)) {

							//place the new entry in an ordered position on the stack
							newEntry = {
								id: tokenid,
								pr: roll,
								custom: graphic.get('name'),
								_pageid: page_id
							};

							//remove items from the stack until we encounter a roll entry equal to or less than the top of the stack
							if (state.InitiativeTracker['highToLow'] === true) {
								while (newEntry.pr > turnorder[turnorder.length - 1].pr) {
									oldstack.push(turnorder.pop());
								}

								//check the tiebreaker if tied or just add it to the stack
								if (newEntry.pr === turnorder[turnorder.length - 1].pr) {
									//get the initiative bonuses for the requisite tokens' characters
									var newTokenInitBonus, oldTokenInitBonus;
									if (charid) newTokenInitBonus = getAttrByName(charid, "AgilityMod", "current");
									else newTokenInitBonus = 0;
									oldTokenInitBonus = getObj("graphic", turnorder[turnorder.length - 1].id).get('represents');
									if (oldTokenInitBonus) oldTokenInitBonus = getAttrByName(oldTokenInitBonus, "AgilityMod", "current");
									else {
										matchingCharacters = findObjs({
											_type: "character",
											name: characterName,
										});
										if (matchingCharacters.length === 0) oldTokenInitBonus = 0;
										else oldTokenInitBonus = getAttrByName(matchingCharacters[0].id, "AgilityMod", "current");
									}

									if (newTokenInitBonus > oldTokenInitBonus) oldstack.push(turnorder.pop());
									turnorder.push(newEntry);
								} else if (newEntry.pr < turnorder[turnorder.length - 1].pr) {
									turnorder.push(newEntry);
								} else {
									log("something fucked up");
								}

								//restore the bottom of the stack
								while (oldstack.length > 0) {
									turnorder.push(oldstack.pop());
								}
							} else {
								while (newEntry.pr < turnorder[turnorder.length - 1].pr) {
									oldstack.push(turnorder.pop());
								}

								//check the tiebreaker if tied or just add it to the stack
								if (newEntry.pr === turnorder[turnorder.length - 1].pr) {
									//get the initiative bonuses for the requisite tokens' characters
									var newTokenInitBonus, oldTokenInitBonus;
									if (charid) newTokenInitBonus = getAttrByName(charid, "AgilityMod", "current");
									else newTokenInitBonus = 0;
									oldTokenInitBonus = getObj("graphic", turnorder[turnorder.length - 1].id).get('represents');
									if (oldTokenInitBonus) oldTokenInitBonus = getAttrByName(oldTokenInitBonus, "AgilityMod", "current");
									else {
										matchingCharacters = findObjs({
											_type: "character",
											name: characterName,
										});
										if (matchingCharacters.length === 0) oldTokenInitBonus = 0;
										else oldTokenInitBonus = getAttrByName(matchingCharacters[0].id, "AgilityMod", "current");
									}

									if (newTokenInitBonus < oldTokenInitBonus) oldstack.push(turnorder.pop());
									turnorder.push(newEntry);
								} else if (newEntry.pr > turnorder[turnorder.length - 1].pr) {
									turnorder.push(newEntry);
								} else {
									log("something fucked up");
								}

								//restore the bottom of the stack
								while (oldstack.length > 0) {
									turnorder.push(oldstack.pop());
								}
							}
						}
					}
				});

				//Push turnorder to roll20
				log("Turn Order Str: " + JSON.stringify(turnorder));
				Campaign().set("turnorder", JSON.stringify(turnorder));
			}

			if (state.InitiativeTracker['statusTurn'] === false) {
				//update all token statuses
			}
		},

		getConfigParam = function (who, param) {
			if (param == null) {
				for (var i = 0; i < CONFIG_PARAMS.length; i++) {
					var head = CONFIG_PARAMS[i][1] + " (" + CONFIG_PARAMS[i][0] + "): ";
					write(head + state.InitiativeTracker[CONFIG_PARAMS[i][0]], who, "", "Tracker");
				}
			} else {
				var err = true;
				for (var i = 0; i < CONFIG_PARAMS.length; i++) {
					if (CONFIG_PARAMS[i][0] == param) {
						var head = CONFIG_PARAMS[i][1] + " (" + CONFIG_PARAMS[i][0] + "): ";
						write(head + state.InitiativeTracker[CONFIG_PARAMS[i][0]], who, "", "Tracker");
						err = false;
						break;
					}
				}
				if (err) {
					write("Error: Config parameter '" + param + "' not found", who, "", "Tracker");
				}
			}
		},

		setConfigParam = function (who, param, value) {
			var err = true;
			for (var i = 0; i < CONFIG_PARAMS.length; i++) {
				if (CONFIG_PARAMS[i][0] == param) {
					state.InitiativeTracker[CONFIG_PARAMS[i][0]] = (value == null ? !state.InitiativeTracker[CONFIG_PARAMS[i][0]] : value);
					err = false;
					break;
				}
			}
			if (err) {
				write("Error: Config parameter '" + param + "' not found", who, "", "Tracker");
			}
		},

		showTrackerHelp = function (who, cmd) {
			write(cmd + " commands:", who, "", "Tracker");
			var helpMsg = "";
			helpMsg += "help:               display this help message\n";
			helpMsg += "round [NUM]:        display the current round number, or set round number to NUM\n";
			helpMsg += "forward:            advance the initiative counter to the next token\n";
			helpMsg += "fwd:                synonym for forward\n";
			helpMsg += "back:               rewind the initiative counter to the previous token\n";
			helpMsg += "start:              sort the tokens in the initiative counter and begin tracking\n";
			helpMsg += "get [PARAM]:        display the value of the specified config parameter, or all config parameters\n";
			helpMsg += "set PARAM [VALUE]:  set the specified config parameter to the specified value (defaults to true)\n";
			helpMsg += "enable PARAM:       set the specified config parameter to true\n";
			helpMsg += "disable PARAM:      set the specified config parameter to false\n";
			helpMsg += "toggle PARAM:       toggle the specified config parameter between true and false";
			write(helpMsg, who, "font-size: small; font-family: monospace", "Tracker");
		},

		handleTrackerMessage = function (args, msg) {
			var who = msg.who;
			var selected = msg.selected;
			let cmd = args.shift();

			switch (cmd) {
				case "sync":
					dataSync();
					log("backend synced with tabletop");
					break;
				case "back":
					try{
						//TODO: Better error handling & turn/round announcements
						var oldTurnOrderStr = Campaign().get('turnorder') || "[]";
						var turnOrder = JSON.parse(oldTurnOrderStr);
						if (turnOrder.length > 0) {
							var oldCount = turnOrder[0].pr;
							turnOrder.unshift(turnOrder.pop());
							var newCount = turnOrder[0].pr;
							var newTurnOrderStr = JSON.stringify(turnOrder);


							//with the turnorder set, handle statuses
							if (state.InitiativeTracker['statusTurn'] == true) {
								if (turnOrder[0].id != -1) {
									var currentToken = getObj("graphic", turnOrder[0].id);

									//create a new token entry if necessary
									stackTokenSync(turnOrder[0].id);
									var currentStackToken = state.InitiativeTracker.token[turnOrder[0].id];
									var characterName = currentToken.get('name');
									var matchingTokens = findObjs({
										_pageid: Campaign().get("playerpageid"),
										_type: "graphic",
										_subtype: "token",
										name: characterName
									});

									//find all tokens that match a given character name
									_.each(matchingTokens, function (selToken) {
										var selStackToken = state.InitiativeTracker.token[selToken.id];
										if (selStackToken.initiative == currentStackToken.initiative) {
											for (var i = 0; i < selStackToken.statuses.length; i++) {
												var selStatus = selStackToken.statuses[i];
												selStatus.duration++;
												if (selStatus.duration < 10) {

													// status has nine or fewer rounds left; update marker to reflect remaining rounds
													selToken.set("status_" + selStatus.name, selStatus.duration);
												} else {
													selToken.set("status_" + selStatus.name, true);
												}
											}
											while (selStackToken.expiredStatuses.length > 0) {
												var selExpStatus = selStackToken.expiredStatuses.pop();
												selStackToken.statuses.push(selExpStatus);
												selToken.set("status_" + selExpStatus.name, 1);
												selStackToken.nextInitiative += getInitModFromAliasOrStatus(getAliasOrName(selExpStatus));
											}
										}
									});
								}
							}
							if (!state.InitiativeTracker.highToLow) {
								// use negatives for low-to-high initiative so inequalities work out the same as high-to-low
								newCount = -newCount;
								oldCount = -oldCount;
							}
							var roundChanged = newCount < oldCount;
							log("the old count is: " + oldCount + " and the new count is: " + newCount);

							if (roundChanged && state.InitiativeTracker['dynamicInit'] === true) {
								state.InitiativeTracker.count = turnOrder[0].pr;
								state.InitiativeTracker.round -= 1;
								Campaign().set('turnorder', Tracker.oldRoundOrder);
								log("Going back and restoring the latched TO str: " + Tracker.oldRoundOrder);
							} else if (roundChanged && state.InitiativeTracker['dynamicInit'] === false) {
								state.InitiativeTracker.count = turnOrder[0].pr;
								state.InitiativeTracker.round -= 1;
								Campaign().set('turnorder', newTurnOrderStr);
							} else {
								state.InitiativeTracker.count = turnOrder[0].pr;
								Campaign().set('turnorder', newTurnOrderStr);
							}
						}
					} catch(e){
						write("Error: No previous round data is stored", who, "", "Tracker");
					}
					break;
				case "restart":
					var turnOrder = JSON.parse(Campaign().get('turnorder') || "[]");
					//sync the backend OR sync and clear the backend if optional parameters are provided
					if (args[0] && args[0] === 'sync') {
						dataSync();
					} else if (args[0] && args[0] === 'del') {
						let currentPageGraphics = findObjs({
							_pageid: Campaign().get("playerpageid"),
							_type: "graphic",
							_subtype: "token",
						});

						_.each(currentPageGraphics, function (selToken) {
							if (selToken.get('bar3_value') != '') {
								selToken.set("statusmarkers",'');
							}
						});
						dataSync();
					}

					//reset the tracker and turn order
					if (turnOrder.length > 0) {
						turnOrder.sort(function (x, y) {
							return (state.InitiativeTracker.highToLow ? y.pr - x.pr : x.pr - y.pr);
						});
						Campaign().set('turnorder', JSON.stringify(turnOrder));
						state.InitiativeTracker.round = 1;
						state.InitiativeTracker.count = turnOrder[0].pr;
						announceRound(state.InitiativeTracker.round);
						announceTurn(turnOrder[0].pr, turnOrder[0].custom, turnOrder[0].id);
					}
					break;
				case "start":
					//TODO: make this work
					break;
				case "get":
					if (args.length < 1) {
						getConfigParam(who, null);
					} else {
						getConfigParam(who, args[0]);
					}
					break;
				case "set":
					if (args.length < 1) {
						write("Error: The 'set' command requires at least one argument (the parameter to set)", who, "", "Tracker");
						break;
					}
					var value = true;
					if (args.length > 1) {
						if ((args[1] != "true") && (args[1] != "yes") && (args[1] != "1")) {
							value = false;
						}
					}
					setConfigParam(who, args[0], value);
					break;
				case "enable":
					if (args.length != 1) {
						write("Error: The 'enable' command requires exactly one argument (the parameter to enable)", who, "", "Tracker");
						break;
					}
					setConfigParam(who, args[0], true);
					break;
				case "disable":
					if (args.length != 1) {
						write("Error: The 'disable' command requires exactly one argument (the parameter to disble)", who, "", "Tracker");
						break;
					}
					setConfigParam(who, args[0], false);
					break;
				case "toggle":
					if (args.length != 1) {
						write("Error: The 'toggle' command requires exactly one argument (the parameter to toggle)", who, "", "Tracker");
						break;
					}
					setConfigParam(who, args[0], null);
					break;
				case "help":
					showTrackerHelp(who, cmd);
					break;
				default:
					write("Error: Unrecognized command: " + cmd, who, "", "Tracker");
					showTrackerHelp(who, cmd);
			}
		},

		addStatus = function (tokenId, status, duration, description) {
			let alias, selectedToken;
			let token = getObj("graphic", tokenId);
			if (!token) {
				log("didn't find a token");
				return;
			}

			//log("addStatus:" + tokenId + "," + status + "," + duration);

			if (state.InitiativeTracker['complexstatushandler'] === true) {
				if (STATUS_TYPES[status] == "persistent") {
					duration = 300;
				} else if (STATUS_TYPES[status] == "round") {
					duration = 1;
				} else if (STATUS_TYPES[status] == "rounds") {}
			}

			//determine the alias and status
			if (STATUS_ALIASES[status]) {
				alias = status;
				status = STATUS_ALIASES[status];
			} else if (_.invert(STATUS_ALIASES)[status]) {
				alias = _.invert(STATUS_ALIASES)[status];
			} else {
				alias = '';
				status = '';
			}

			//log("status:" + status + ", alias:" + alias);

			//sync stack with extant tokens
			stackTokenSync(tokenId);
			selectedToken = state.InitiativeTracker.token[tokenId];
			selectedToken.nextInitiative += getInitModFromAliasOrStatus(status);
			state.InitiativeTracker.token[tokenId].statuses.push({
				'duration': duration,
				'count': state.InitiativeTracker.count,
				'name': status,
				'alias': alias,
				'severity': 0
			});
			if (duration > 10) {
				duration = true;
			}
			token.set("status_" + status, duration);
		},

		showStatusHelp = function (who, cmd) {
			write(cmd + " commands:", who, "", "Tracker");
			var helpMsg = "";
			helpMsg += "help:               display this help message\n";
			helpMsg += "add DUR ICON DESC:  add DUR rounds of status effect with specified icon and description to selected tokens\n";
			helpMsg += "list:               list all status effects for selected tokens\n";
			helpMsg += "show:               synonym for list\n";
			helpMsg += "remove [ID]:        remove specified status effect, or all status effects from selected tokens\n";
			helpMsg += "rem, delete, del:   synonyms for remove\n";
			helpMsg += "icons:              list available status icons and aliases";
			write(helpMsg, who, "font-size: small; font-family: monospace", "Tracker");
		},

		handleStatusMessage = function (args, msg) {
			let who = msg.who;
			let selected = msg.selected;
			let output = '';
			if (!args) return showStatusHelp(who, "filler");
			let cmd = args.shift();

			switch (cmd) {
				case "add":
					if ((!selected) || (selected.length <= 0)) {
						write("Error: The 'add' command requires at least one selected token", who, "", "Tracker");
						break;
					}
					if (args.length < 3) {
						write("Error: The 'add' command requires three arguments (duration, icon, description)", who, "", "Tracker");
						break;
					}
					if (state.InitiativeTracker.round <= 0) {
						write("Error: Initiative not being tracked", who, "", "Tracker");
						break;
					}
					for (var i = 0; i < selected.length; i++) {
						if (selected[i]._type != "graphic") {
							continue;
						}
						var token = getObj(selected[i]._type, selected[i]._id);
						if (!token) {
							continue;
						}
						//log(token.get('id') + "," + args[0] + "," + args[1] + "," + args[2]);
						addStatus(token.get('id'), args[0], args[1], args[2]);
					}
					break;
				case "list":
				case "show":
					let tokenIds = [];
					let tokenNames = {};
					if ((!selected) || (selected.length <= 0)) {
						write("Error: The '" + cmd + "' command requires at least one selected token", who, "", "Tracker");
						break;
					}

					for (let i = 0; i < selected.length; i++) {
						if (selected[i]._type != "graphic") {
							continue;
						}
						let token = getObj(selected[i]._type, selected[i]._id);
						if (!token) {
							continue;
						}
						tokenIds.push(selected[i]._id);
						tokenNames[selected[i]._id] = token.get('name');
					}

					_.each(tokenIds, function (id) {
						let selStackToken = state.InitiativeTracker.token[id];
						if (!selStackToken.statuses) {
							output += "No status effects for token: " + tokenNames[id];
						} else {
							output += "Initiative Modifiers: " + selStackToken.initiative + " " + selStackToken.nextInitiative + "\n";
							_.each(selStackToken.statuses, function (selStatus, index) {
								output += index + ": " + tokenNames[id] + ": " + selStatus.alias + " " + selStatus.duration + "\n";
							});
						}
					});

					let from = (who ? "Tracker" : "");

					if (who) {
						write(output, who, "", from);
					} else {
						sendChat(from, "/desc " + output);
					}

					break;
				case "remove":
				case "rem":
				case "delete":
				case "del":
					if ((args.length == 0) && (selected) && (selected.length > 0)) {
						// some tokens selected and no ID specified; remove all status effects from selected tokens
						for (let k = 0; k < selected.length; k++) {
							if (selected[k]._type != "graphic") {
								continue;
							}
							let token = getObj(selected[k]._type, selected[k]._id);
							if (!token) {
								continue;
							}
							let stackToken = state.InitiativeTracker.token[selected[k]._id];
							for (let i = 0; i < stackToken.statuses.length; i++) {
								let status = stackToken.statuses[i].name;
								token.set("status_" + status, false);
								stackToken.nextInitiative -= getInitModFromAliasOrStatus(status);
								stackToken.statuses.splice(i, 1);
								i -= 1;
								let alias = (_.invert(STATUS_ALIASES))[status];
								if(!alias) 	announceStatusExpiration(status, token.get('name'));
								else 		announceStatusExpiration(alias, token.get('name'));
							}
						}
						break;
					}
					// ID specified or nothing selected; require ID and remove specified status effect
					if (args.length != 1) {
						write("Error: The del/delete/rem/remove command requires an argument (status effect ID)", who, "", "Tracker");
						break;
					}
					var idx = args[0];
					if(isNaN(idx)){
						//Treats the given id as an alias or status and tries to remove those
						
						let name;
						if (STATUS_ALIASES[idx]) {
							name=STATUS_ALIASES[idx];
						} else if(ALL_STATUSES[idx]){
							name=idx;
						}else {
							write("Error: " + args[0]+" isn't a status or alias", who, "", "Tracker");
							break;
						}
						for (let i = 0; i < selected.length; i++) {
							if (selected[i]._type != "graphic") {
								continue;
							}
							let token = getObj(selected[i]._type, selected[i]._id);
							if (!token) {
								continue;
							}
							let stackToken = state.InitiativeTracker.token[selected[i]._id];
							for(let j = 0; j < stackToken.statuses.length; j++){
								if(stackToken.statuses[j].name !== name) continue;
								token.set("status_" + name, false);
								stackToken.nextInitiative -= getInitModFromAliasOrStatus(idx);
								stackToken.statuses.splice(j, 1);
								j -= 1;
								announceStatusExpiration(idx, token.get('name'));
							}
						}
					}else{
						//treats the given id as a numbered entry in the status list
						if (idx < 0) {
							write("Error: Invalid status effect ID: " + args[0], who, "", "Tracker");
							break;
						}
						for (let i = 0; i < selected.length; i++) {
							if (selected[i]._type != "graphic") {
								continue;
							}
							let token = getObj(selected[i]._type, selected[i]._id);
							if (!token) {
								continue;
							}
							let stackToken = state.InitiativeTracker.token[selected[i]._id];
							if (!stackToken.statuses[idx]) {
								write("Error: Invalid status effect ID: " + args[0], who, "", "Tracker");
								continue;
							}
							let status = stackToken.statuses[idx].name;
							token.set("status_" + status, false);
							stackToken.nextInitiative -= getInitModFromAliasOrStatus(status);
							stackToken.statuses.splice(idx, 1);
							let alias = (_.invert(STATUS_ALIASES))[status];
							if(!alias) 	announceStatusExpiration(status, token.get('name'));
							else 		announceStatusExpiration(alias, token.get('name'));	
						}
					}
					break;
				case "icons":
					write("Status Icons: " + ALL_STATUSES.join(", "), who, "", "Tracker");
					write("Status Aliases:", who, "", "Tracker");
					for (let k in STATUS_ALIASES) {
						if (output) {
							output += "\n";
						}
						output += k + ": " + STATUS_ALIASES[k];
					}
					write(output, who, "", "Tracker");
					break;
				case "help":
					showStatusHelp(who, cmd);
					break;
				default:
					write("Error: Unrecognized command: " + cmd, who, "", "Tracker");
					showStatusHelp(who, cmd);
			}
		},

		handleChatMessage = function (msg_orig) {
			//try {
			let msg = _.clone(msg_orig),
				args;

			if (msg.type !== "api") return;

			args = msg.content
				.replace(/<br\/>\n/g, ' ')
				.replace(/(\{\{(.*?)\}\})/g, " $2 ")
				.split(/\s+-/);

			//log(args[0] + "," + args[1]);


			switch (args.shift()) {
				case '!tracker':
					return handleTrackerMessage(args, msg);
				case '!status':
					return handleStatusMessage(args, msg);
			}
			/*} catch(e){
				//do something
				log("you fucked up");
				

			}*/
		},

		registerTracker = function () {
			initConfig();
			on("change:campaign:turnorder", handleTurnChange);
			if ((typeof (Shell) != "undefined") && (Shell) && (Shell.registerCommand)) {
				Shell.registerCommand("!tracker", "!tracker <subcommand> [args]", "Configure the initiative tracker", handleTrackerMessage);
				Shell.registerCommand("!status", "!status <subcommand> [args]", "Track status effects on tokens", handleStatusMessage);
				if (Shell.write) {
					Tracker.write = Shell.write;
				}
			} else {
				on("chat:message", handleChatMessage);
			}
		};

	return {
		RegisterTracker: registerTracker
	};

}());

on("ready", function () {
	'use strict';
	Tracker.RegisterTracker();
});