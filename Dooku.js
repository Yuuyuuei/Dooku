'use strict';

const Vocabulary = {
    tags: {
        DeepVerb: {
            isA: "Verb"
        },
        Thing: {
            isA: "Noun"
        },
        Actor: {
            isA: "Noun"
        },
        Item: {
            isA: "Noun"
        }
    },
    words: {

    }
}

const GameInfo = {
    Name: ``,
    Description: ``,
    Author: ``,
    AuthorEmail: ``,
    Version: ``,
    Intro: ``,
    Show: function () {
        Dooku.IO.Append(
            `<h1> ${this.Name ? this.Name : ""} </h1>`,
            `<blockquote> ${this.Description ? this.Description : ""} </blockquote>`,
            `<blockquote> By ${this.Author ? this.Author : ""} <blockquote> (${this.AuthorEmail ? this.AuthorEmail : ""}) </blockquote></blockquote>`,
            `${this.Intro ? this.Intro : ""}`
        )
    }
}

const Global = {
    TurnsPassed: 0,
    Add: (key, value) => {
        Global[key] = value;
    },
    Set: (key, value) => {
        Global[key] = value;
    },
    Get: (key) => {
        return Global[key];
    },
    Remove: (key) => {
        delete Global[key];
    }
}

const Dooku = {
    Started: false,
    IO: {
        Input: null,
        Output: null,
        Attach: function (input, output) {
            this.Input = input;
            this.Output = output;
        },
        Append: function (...elements) { // Backend function to append to the output
            // Prepend output before appending
            var filteredElements = [];
            for (var element of elements) {
                if (element)
                    filteredElements.push(this.Prepend(element));
            }

            for (var fElements of filteredElements) {
                if (fElements) {
                    this.Output.append(fElements);
                }
            }

            this.Output.scrollTop(this.Output[0].scrollHeight);
        },
        Prepend: function (element) { // Prepend the output before appending it
            // Append <p> element if it is just a simple string
            if (!/<[a-z][\s\S]*>/i.test(element))
                element = "<p>" + element + "</p>"

            return element;
        },
        // Very simple parser
        Parse: (value) => {
            // split ands
            var arrValue = value.split("and");
            for (var i in arrValue) {
                var doc = nlp(arrValue[i]);
                // Find a verb
                if (doc.has("#DeepVerb")) {
                    var match = doc.match("#DeepVerb *?");
                    // Get the verb from list
                    var verb = DeepVerb.GetVerb(match.out("text"));
                    if (verb) {
                        if (Dooku.Started === false) {
                            // Allow system verbs even if game hasn't started yet
                            if (!(verb instanceof SysVerb)) {
                                return;
                            }
                        }

                        // Get args
                        var args = [];
                        var nounMatch = match.match("#Noun?").trim().out("array");
                        for (var j in nounMatch) {
                            var thing = Thing.GetThing(nounMatch[j]);
                            if (!thing) {
                                Dooku.IO.Append(
                                    ` I don't know what you mean by '${nounMatch[j]}'`
                                )
                                return;
                            }
                            args.push(thing);
                        }
                        // Check preposition
                        var preposition = match.match("#Preposition");
                        var hasPreposition = preposition.length > 0;

                        // Execute verb after checks
                        let result = true;
                        result = verb.CheckAction(Actor.Me(), ...args);

                        if (Actor.Me() && result)
                            if (Actor.Me().Location)
                                result = Actor.Me().Location.CheckVerb(verb, args);

                        if (result) {
                            if (hasPreposition) {
                                // Execute verb depending on its preposition
                                // TODO: Currently only executes the first preposition (NOT A PROBLEM RIGHT?)
                                var preStr = preposition.term(0).trim().out("text");
                                var preStr = preStr.charAt(0).toUpperCase() + preStr.slice(1);
                                result = verb[preStr + "CheckAction"](Actor.Me(), ...args);
                                if (result)
                                    verb[preStr + "Action"](Actor.Me(), ...args);
                                return;
                            }

                            // Default just execute its action
                            verb.Action(Actor.Me(), ...args);

                            // Increment turn count if not sysverb
                            if (!(verb instanceof SysVerb)) {
                                Global.TurnsPassed += 1;
                            }
                        }
                    }
                }
            }
        }
    },
    Setup: function () {
        // Form submit
        this.IO.Input.on('submit', (event) => {
            event.preventDefault();
            this.IO.Parse($(this.IO.Input).find("input:first").val());

            $(this.IO.Input).find("input:first").val("");
        });

        // Add all deep verbs to vocab
        for (let i in DeepVerb.List) {
            var verb = DeepVerb.List[i];
            for (let j in verb.Verb) {
                Vocabulary.words[verb.Verb[j]] = "DeepVerb";
            }
        }

        // Add all things to vocab
        for (let i in Thing.List) {
            var thing = Thing.List[i];
            for (let j in thing.Noun) {
                if (!Vocabulary.words[thing.Noun[j]])
                    Vocabulary.words[thing.Noun[j]] = [];
                Vocabulary.words[thing.Noun[j]].push("Thing");
            }
        }

        // Add all actors to vocab
        for (let i in Actor.List) {
            var actor = Actor.List[i];
            for (let j in actor.Noun) {
                if (!Vocabulary.words[actor.Noun[j]])
                    Vocabulary.words[actor.Noun[j]] = [];
                Vocabulary.words[actor.Noun[j]].push("Actor");
            }
        }

        // // Add all actors to vocab
        for (let i in Item.List) {
            var item = Item.List[i];
            for (let j in item.Noun) {
                if (!Vocabulary.words[item.Noun[j]])
                    Vocabulary.words[item.Noun[j]] = [];
                Vocabulary.words[item.Noun[j]].push("Item");
            }
        }

        // Add vocabulary
        nlp.plugin(Vocabulary);
    },
    Start: function (main) {
        this.Setup();

        // User main
        main();

        // Backend start game
        if (Actor.CurrentPlayer)
            Actor.CurrentPlayer.LookAround();

        // Game has started
        this.Started = true;
    },
    Quit: function (quitMain) {
        // TODO: Do some clean up here etc....

        // User quit
        quitMain();

        // Quit the game

        this.Started = false;
    }
}

// Handles events between objects
const EventManager = {
    On(eventName, binding, handle) {
        if (!binding.Events) binding.Events = [];
        if (!binding.Events[eventName]) {
            binding.Events[eventName] = [];
        }
        binding.Events[eventName].push(handle);
    },
    Trigger(eventName, binding, ...args) {
        // Return if no event named
        if (!binding.Events[eventName]) {
            return;
        }

        // Call all the handlers
        binding.Events[eventName].forEach(handle => handle.apply(this, args));
    }
}

// Every thing can hold an infinite number of components
class DookuBehaviour {
    constructor() {
        // Refers to the thing class that holds this behaviour
        this.Thing = null;
    }

    Start() {

    }
}

class Thing {
    constructor() {
        this.Name = null;
        this.Description = null;
        this.ADescription = null;
        this.TheDescription = null;
        this.Noun = []; // Vocab list
        this.Contents = [];
        this.Behaviours = [];
        this.Location = null;
        this.Listed = true;
        this.Reachable = true;

        Thing.List.push(this);
    }

    MoveInto(thing) {
        // var loc = this.Location;
        // while (loc) {
        //     loc.grab(this);
        //     loc = loc.Location;
        // }

        if (this.Location) {
            this.Location.Contents = this.Location.Contents.filter(item => item !== this)
        }
        this.Location = thing;
        if (thing) {
            thing.Contents.push(this);
        }

        return (null);
    }

    // Checks if this thing is in obj
    IsIn(obj) {
        var loc = this.Location;
        if (loc) {
            return loc === obj;
        }
    }

    // Checks if this thing is reachable from obj
    IsReachable(obj) {
        if (!obj.Location || !this.Location || !this.Reachable)
            return false;

        if (obj.Location === this.Location || this.Location === obj || obj.Location === this)
            return true;

        return false;
    }

    // Checks if a behaviour is the right type before pushing
    // This can be override, primarily to ensure some behaviour can only be added
    // to specific things (items, actors etc...) 
    CheckBehaviour(behaviour) {
        return behaviour instanceof DookuBehaviour;
    }

    // Returns if thing has a behaviour
    HasBehaviour(behaviour) {
        if (typeof behaviour === "string" || behaviour instanceof String) {
            return this.Behaviours.some(comp => comp.constructor.name === behaviour);
        }
        return this.Behaviours.some(comp => comp.constructor.name === behaviour.constructor.name);
    }

    AddBehaviour(behaviour) {
        if (this.CheckBehaviour(behaviour)) {
            if (!this.HasBehaviour(behaviour)) {
                behaviour.Thing = this;
                behaviour.Start();
                this.Behaviours.push(behaviour);
                return behaviour;
            }
        }
    }

    GetBehaviour(behaviour) {
        if (typeof behaviour === "string" || behaviour instanceof String) {
            return this.Behaviours.filter(comp => comp.constructor.name === behaviour)[0];
        }
        return this.Behaviours.filter(comp => comp.constructor.name === behaviour.constructor.name)[0];
    }

    static GetThing(key) {
        return Thing.List.filter(thing => {
            // Filter through each verb and see if it has the right pattern
            for (var i in thing.Noun) {
                var doc = nlp(key);
                if (doc.has(thing.Noun[i])) {
                    return thing;
                }
            }
        })[0];
    }
}
Thing.List = [];

class Item extends Thing {
    constructor() {
        super();

        Item.List.push(this);
    }
}
Item.List = []

class Room extends Thing {
    constructor() {
        super();

        this.North = () => {
            return null;
        };
        this.South = () => {
            return null;
        };
        this.East = () => {
            return null;
        };
        this.West = () => {
            return null;
        };
        this.Seen = false; // Has the player seen the room before
        this.LookAround = () => {
            this.SayLook();
        }
        this.LookOnEnter = () => {
            return true;
        }
        // Check verb before calling the action
        // This is to ensure that some verbs are not allowed in some rooms
        this.CheckVerb = (verb, ...args) => {
            return true;
        }

        Room.List.push(this);
    }

    SayLook() {
        var name = typeof this.Name === "function" ? this.Name() : this.Name;
        var description = typeof this.Description === "function" ? this.Description() : this.Description;
        Dooku.IO.Append(
            "<h5>" + name + "</h5>",
            description
        )
    }
}
Room.List = []

class Actor extends Thing {
    constructor() {
        super();

        this.LookAround = () => {
            if (this.Location)
                this.Location.LookAround();
        }

        Actor.List.push(this);
    }

    TravelTo(room) {
        if (!this.Location) return;

        if (!room) {
            if (this == Actor.Me()) {
                Dooku.IO.Append(
                    `You can't go that way.`
                )
            }
            return;
        };

        if (typeof room === "string" || room instanceof String) {
            // Show the string if it is the player character
            if (this === Actor.Me()) {
                Dooku.IO.Append(room)
            }
            return;
        }


        if (Actor.Me())
            if (Actor.Me().Location)
                if (this.Location == Actor.Me().Location) {
                    // Say leaving
                }

        this.MoveInto(room);

        if (this === Actor.Me() && !room.Seen) {
            room.Seen = true;
        }

        if (this === Actor.Me() && room.LookOnEnter()) {
            room.LookAround();
        }

        if (Actor.Me())
            if (Actor.Me().Location)
                if (this.Location == Actor.Me().Location) {
                    // Say arriving
                }
    }

    IsCarrying(obj) {
        return obj.IsIn(this);
    }

    static Possess(newActor) {
        Actor.OldPlayer = Actor.CurrentPlayer;
        Actor.CurrentPlayer = newActor;

        return null;
    }

    static Me() {
        return Actor.CurrentPlayer;
    }
}
Actor.OldPlayer = null;
Actor.CurrentPlayer = null;
Actor.List = []

class DeepVerb {
    constructor() {
        // Checks if an action can be passed before calling it
        this.CheckAction = function (actor, ...args) {
            return true;
        };
        this.Action = function (actor, ...args) {};
        this.OnAction = function (actor, ...args) {};
        this.ToAction = function (actor, ...args) {};
        this.InAction = function (actor, ...args) {};
        this.Verb = [];

        DeepVerb.List.push(this);
    }

    IsValid(val) {
        return this.Verb.some(v => v == val);
    }

    static HasVocab(key) {
        return DeepVerb.List.some(verb => {
            // Filter through each verb and see if it has the right pattern
            for (var i in verb.Verb) {
                var doc = nlp(key);
                if (doc.has(verb.Verb[i])) {
                    return true;
                }
            }
        })[0];
    }

    static GetVerb(key) {
        return DeepVerb.List.filter(verb => {
            // Filter through each verb and see if it has the right pattern
            for (var i in verb.Verb) {
                var doc = nlp(key);
                if (doc.has(verb.Verb[i])) {
                    return verb;
                }
            }
        })[0];
    }
}
DeepVerb.List = [];