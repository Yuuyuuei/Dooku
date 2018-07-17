'use strict';

class FixedItem extends DookuBehaviour {
    constructor() {
        super();
        this.CannotTakeMessage = `You can't take that.`;
    }
}

class Readable extends DookuBehaviour {
    constructor() {
        super();
        this.Message = function () {
            return null;
        };
        this.CheckRead = function (actor) {
            // Ensure actor is in the same location or is holding thing
            if (!(this.Thing.Location === actor.Location) && !this.Thing.IsIn(actor)) {
                if (actor === Actor.Me()) {
                    // Output if player
                    Dooku.IO.Append(
                        // TODO: Use item name instead of that
                        ` You don't see that `
                    )
                }
                return false;
            }

            return true;
        };
        this.Read = function (actor) {
            if (this.CheckRead(actor)) {
                // Return the message if it is the player
                if (actor === Actor.Me()) {
                    Dooku.IO.Append(this.Message());
                } else {
                    // Otherwise state that the actor is reading
                    // If the actor is in the same room as the player
                    if (actor.Location === Actor.Me().Location) {
                        Dooku.IO.Append(
                            `${this.actor.Name} starts to read ${this.Thing.Name}`
                        )
                    }
                }
            }
        };
    }
}

// Surface indicates that objects can be put on it
class Surface extends DookuBehaviour {
    constructor() {
        super();
        this.IsSurface = true;

    }
};

class LightSource extends DookuBehaviour {
    constructor() {
        super();
        this.IsOn = false;
        this.TurnOn = () => {
            this.IsOn = true;
        }
        this.TurnOff = () => {
            this.IsOn = false;
        }
        this.Toggle = () => {
            this.IsOn = !this.IsOn;
        }
    }
};

class LitRoom extends DookuBehaviour {
    constructor() {
        super();
        this.DarkLookMessage = `It's pitch black.`;
        // Method must be overriden to allow lighs to be on or off
        this.LightsOn = () => {
            return false;
        }

        // Check the room has a light source
        // If it does, then the room is lit. LightsOn method overrides this
        this.IsLit = () => {
            if (this.LightsOn())
                return true;

            for (var i in this.Thing.Contents) {
                var a = this.Thing.Contents[i];
                if (a instanceof Item) {
                    if (a.HasBehaviour("LightSource") && a.GetBehaviour("LightSource").IsOn) {
                        return true;
                    }
                }
            }
        }
    }

    Start() {
        this.Thing.LookAround = () => {
            if (this.IsLit()) {
                this.Thing.SayLook();
            } else {
                this.SayDarkLook();
            }
        }
    }

    SayDarkLook() {
        Dooku.IO.Append(
            `${this.DarkLookMessage}`
        )
    }
}

class Wearable extends DookuBehaviour {
    constructor() {
        super();
        this.IsWorn = false;

        this.AlreadyWearingMessage = `You are already wearing it`;
        this.NotWearingMessage = `You are not wearing that`;
        this.WearMessage = `You are now wearing it`
        this.UnwearMessage = `You are not wearing it anymore`

        this.Wear = (actor) => {
            if (this.IsWorn && this.Thing.IsIn(actor)) {
                Dooku.IO.Append(
                    `${this.AlreadyWearingMessage}`
                )
                return;
            }

            if (!this.Thing.IsIn(actor)) {
                Dooku.IO.Append(
                    `First taking it. `
                )

                Dooku.IO.Parse(`take ${this.Thing.Name}`);

                if (!this.Thing.IsIn(actor)) {
                    // can't find it, exit
                    return;
                }
            }

            // Wear it 
            Dooku.IO.Append(
                `${this.WearMessage}`
            )
            this.IsWorn = true;
        }

        this.Unwear = (actor) => {
            if (!this.IsWorn) {
                Dooku.IO.Append(
                    `${this.NotWearingMessage}`
                )
                return;
            }
            if (!this.IsWorn && !this.Thing.IsIn(actor)) {
                Dooku.IO.Append(
                    `${this.NotWearingMessage}`
                )
                return;
            }

            Dooku.IO.Append(
                `${this.UnwearMessage}`
            )
            this.IsWorn = false;
        }
    }
    Start() {
        // Callback to unwear when dropping or putting on something
        var takeOffFirst = (actor) => {
            if (this.IsWorn) {
                Dooku.IO.Append(
                    `First taking it off. `
                )
                this.IsWorn = false;
            }
        }
        this.Thing.On("OnDrop", takeOffFirst);
        this.Thing.On("OnPut", takeOffFirst);
    }
}

// Indicates a system verb such as load or save
class SysVerb extends DeepVerb {
    constructor() {
        super();
    }
}

// Indicates a verb that moves the player
class TravelVerb extends DeepVerb {
    constructor() {
        super();
    }
    TravelDir(actor, direction) {
        if (typeof direction === "string" || direction instanceof String || direction instanceof Room) {
            return direction;
        }
        if (typeof direction === "function") {
            return direction();
        }

        return null;
    }
}

const NorthVerb = new TravelVerb();
NorthVerb.Verb = ["north", "n", "go north"];
NorthVerb.Action = function (actor) {
    if (actor) {
        actor.TravelTo(this.TravelDir(actor, actor.Location.North));
    }
};

const SouthVerb = new TravelVerb();
SouthVerb.Verb = ["south", "s", "go south"];
SouthVerb.Action = function (actor) {
    if (actor) {
        actor.TravelTo(this.TravelDir(actor, actor.Location.South));
    }
};

const EastVerb = new TravelVerb();
EastVerb.Verb = ["east", "e", "go east"];
EastVerb.Action = function (actor) {
    if (actor) {
        actor.TravelTo(this.TravelDir(actor, actor.Location.East));
    }
};

const WestVerb = new TravelVerb();
WestVerb.Verb = ["west", "w", "go west"];
WestVerb.Action = function (actor) {
    if (actor) {
        actor.TravelTo(this.TravelDir(actor, actor.Location.West));
    }
};

const ExamineVerb = new DeepVerb();
ExamineVerb.Verb = ["examine", "x", "look at"];
ExamineVerb.CheckAction = function (actor, thing) {
    if (!thing) {
        Dooku.IO.Append(
            ` What do you want to look at? `
        )
        return false;
    }
    if (!thing.IsReachable(actor)) {
        Dooku.IO.Append(
            ` You can't reach that `
        )
        return false
    }

    return true;
}
ExamineVerb.Action = (actor, thing) => {
    if (thing) {
        var description = typeof thing.Description === "function" ? thing.Description() : thing.Description;
        Dooku.IO.Append(description);
    }
};

const LookVerb = new DeepVerb();
LookVerb.Verb = ["look", "l"];
LookVerb.Action = (actor) => {
    actor.LookAround();
};

Object.assign(Item.prototype, {
    DroppedMessage: `Dropped. `,
    CheckDrop(actor) {
        return true;
    },
    Drop(actor) {
        if (!this.IsIn(actor)) {
            return;
        }
        if (this.CheckDrop(actor)) {
            this.Trigger("OnDrop", this);
            this.MoveInto(actor.Location);
            Dooku.IO.Append(
                ` ${this.DroppedMessage} `
            )
        }
    }
});
const DropVerb = new DeepVerb();
DropVerb.Verb = ["drop"];
DropVerb.CheckAction = function (actor, item) {
    if (!item) {
        Dooku.IO.Append(
            ` What do you want to drop? `
        )
        return false;
    }
    if (!item.IsIn(actor)) {
        Dooku.IO.Append(
            ` You don't have it `
        )
        return false
    }

    return true;
}
DropVerb.Action = function (actor, item) {
    item.Drop(actor);
};
DropVerb.OnCheckAction = function (actor, item, thing) {
    return PutVerb.OnCheckAction(actor, item, thing);
}
DropVerb.OnAction = function (actor, item, thing) {
    PutVerb.OnAction(actor, item, thing);
}

const ReadVerb = new DeepVerb();
ReadVerb.Verb = ["read"];
ReadVerb.CheckAction = function (actor, thing) {
    // Missing noun
    if (!thing) {
        Dooku.IO.Append(
            ` What do you want to read? `
        )
        return false;
    }
    // Make sure the item is readable
    if (!thing.HasBehaviour("Readable")) {
        Dooku.IO.Append(
            ` You can't read that. `
        )
        return false;
    }
    return true;
}
ReadVerb.Action = (actor, thing) => {
    thing.GetBehaviour("Readable").Read(actor);
};

Object.assign(Item.prototype, {
    PutOnMessage: `Okay. `,
    CheckPut(actor) {
        return true;
    },
    // Drop on something
    PutOn(actor, onThing) {
        if (!this.IsIn(actor)) {
            return;
        }
        if (!(onThing.Location === actor.Location) && !onThing.IsIn(actor)) {
            return;
        }

        if (!onThing.HasBehaviour("Surface")) {
            return;
        }
        if (this.CheckPut(actor)) {
            this.Trigger("OnPut", this, onThing);
            this.MoveInto(onThing);
            if (actor === Actor.Me()) {
                Dooku.IO.Append(
                    ` ${this.PutOnMessage} `
                )
            }
        }
    }
});
const PutVerb = new DeepVerb();
PutVerb.Verb = ["put", "place"];
PutVerb.CheckAction = function (actor, thing, onThing) {
    if (!thing) {
        Dooku.IO.Append(
            ` What do you want to put? `
        )
        return false;
    }

    if (!onThing) {
        Dooku.IO.Append(
            ` What do you want to put that on? `
        )
        return false;
    }

    if (!thing.IsIn(actor)) {
        Dooku.IO.Append(
            ` You don't have it `
        )
        return false
    }

    if (onThing.Location != actor.Location && !onThing.IsIn(actor)) {
        Dooku.IO.Append(
            // TODO: Use item name instead of that
            ` You don't see that `
        )
        return false;
    }

    return true;
}
PutVerb.OnCheckAction = function (actor, thing, onThing) {
    if (!onThing.HasBehaviour("Surface")) {
        Dooku.IO.Append(
            ` You can't put it on that. `
        )
        return false;
    }

    return true;
}
PutVerb.OnAction = (actor, thing, onThing) => {
    thing.PutOn(actor, onThing);
};