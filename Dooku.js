'use strict';

const NLP = new Bravey.Nlp.Fuzzy();

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
            `<p>${this.Intro ? this.Intro : ""}</p>`
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
            var filteredElements = this.Prepend(elements);
            for (var i of filteredElements) {
                this.Output.append(i);
            }
        },
        Prepend: function (...elements) { // Prepend the output before appending it
            var filteredElements = [];
            for (var i of elements) {
                if (!i instanceof String) continue; // Only append strings

                // Filter using NLP

                filteredElements.push(i);
            }
            return filteredElements;
        },
        // Very simple parser
        Parse: function (value) {
            // split ands
            let arrValue = value.split("and");

            for (var i in arrValue) {
                // Parse
                var out = NLP.test(arrValue[i]);
                if (out) {
                    if (DeepVerb.IsVocab(out.intent)) {
                        var vocab = DeepVerb.GetVocab(out.intent);
                        var result = true;
                        if (Actor.Me())
                            if (Actor.Me().Location) {
                                result = Actor.Me().Location.CheckVerb(vocab, out);
                            }

                        if (result)
                            vocab.Action(Actor.Me(), out);
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

        // Process all verbs
        for(var i in DeepVerb.List) {
            DeepVerb.List[i].Process();
        }

        // Append NLP
        let directions = new Bravey.StringEntityRecognizer("direction");
        directions.addMatch("north", "north");
        directions.addMatch("north", "n");
        directions.addMatch("south", "south");
        directions.addMatch("south", "s");
        directions.addMatch("east", "east");
        directions.addMatch("east", "e");
        directions.addMatch("west", "west");
        directions.addMatch("west", "w");
        NLP.addEntity(directions);

        let things = new Bravey.StringEntityRecognizer("thing");
        for (var i in Thing.List) {
            var thing = Thing.List[i];
            things.addMatch(thing, thing.Name)
            for (var j in thing.Entities) {
                things.addMatch(thing, thing.Entities[j])
            }
        }
        NLP.addEntity(things);

        let items = new Bravey.StringEntityRecognizer("item");
        for (var i in Item.List) {
            var item = Item.List[i];
            items.addMatch(item, item.Name)
            for (var j in item.Entities) {
                items.addMatch(item, item.Entities[j])
            }
        }
        NLP.addEntity(items);

        let actors = new Bravey.StringEntityRecognizer("actor");
        for (var i in Actor.List) {
            var actor = Actor.List[i];
            actors.addMatch(actor, actor.Name)
            for (var j in actor.Entities) {
                actors.addMatch(actor, actor.Entities[j])
            }
        }
        NLP.addEntity(actors);
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
    }
}

let eventSystem = {
    // Used to add events to execude on trigger
    On(eventName, handle) {
        if (!this.Events) this.Events = [];
        if (!this.Events[eventName]) {
            this.Events[eventName] = [];
        }
        this.Events[eventName].push(handle);
    },

    // Trigger an event with name
    Trigger(eventName, ...args) {
        // Return if no event named
        if (!this.Events[eventName]) {
            return;
        }

        // Call all the handlers
        this.Events[eventName].forEach(handle => handle.apply(this, args));
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
Object.assign(DookuBehaviour.prototype, eventSystem);

class Thing {
    constructor() {
        this.Name = null;
        this.Description = null;
        this.ADescription = null;
        this.TheDescription = null;
        this.Entities = []; // Vocab list
        this.Contents = [];
        this.Behaviours = [];
        this.Location = null;
        this.Islisted = true;
        this.IsReachable = true;
        this.Events = {};
        this.MoveInto = (thing) => {
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
        this.IsReachable = (thing) => {
            if (!thing.Location)
                return false;
            if (!this.Location)
                return false;
            if (!this.IsReachable)
                return false;

            if (thing.Location === this.Location || thing.Location === this)
                return true;

            return false;
        }

        Thing.List.push(this);
    }

    GetName() {
        if (typeof this.Name === "function") {
            return this.Name();
        }

        return this.Name;
    }

    GetDescription() {
        if (typeof this.Description === "function") {
            return this.Description();
        }

        return this.Description;
    }

    IsIn(obj) {
        var loc = this.Location;
        if (loc) {
            return loc === obj;
        }
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
}
Thing.List = [];
Object.assign(Thing.prototype, eventSystem);

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
        this.CheckVerb = (vocab, out) => {
            return true;
        }

        Room.List.push(this);
    }

    SayLook() {
        Dooku.IO.Append(
            `<h5>${this.GetName()}</h5>`,
            `<p>${this.GetDescription()}</p>`
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
                    `<p>You can't go that way.</p>`
                )
            }
            return;
        };

        if (typeof room === "string" || room instanceof String) {
            // Show the string if it is the player character
            if (this == Actor.Me()) {
                Dooku.IO.Append(
                    `<p>${room}</p>`
                )
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
    // constructor(vocab) {
    constructor(vocab) {
        this.Action = (actor, out) => {};
        this.Vocab = {};

        DeepVerb.List.push(this);
    }

    // Process the verb
    Process() {
        for (var a in this.Vocab) {
            NLP.addIntent(a, this.Vocab[a].entities);
            for (var c in this.Vocab[a].documents) {
                NLP.addDocument(this.Vocab[a].documents[c], a);
            }
        }
    }

    static IsVocab(key) {
        return DeepVerb.List.some(verb => key in verb.Vocab);
    }
    static GetVocab(key) {
        return DeepVerb.List.filter(verb => key in verb.Vocab)[0];
    }
}
DeepVerb.List = [];