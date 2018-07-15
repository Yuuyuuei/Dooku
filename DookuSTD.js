'use strict';

class FixedItem extends DookuBehaviour {
    constructor() {
        super();
        this.CannotTakeMessage = `You can't take that.`;
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
            `<p>${this.DarkLookMessage}</p>`
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
                    `<p>${this.AlreadyWearingMessage}</p>`
                )
                return;
            }

            if (!this.Thing.IsIn(actor)) {
                Dooku.IO.Append(
                    `<p>First taking it. </p>`
                )

                Dooku.IO.Parse(`take ${this.Thing.Name}`);

                if (!this.Thing.IsIn(actor)) {
                    // can't find it, exit
                    return;
                }
            }

            // Wear it 
            Dooku.IO.Append(
                `<p>${this.WearMessage}</p>`
            )
            this.IsWorn = true;
        }

        this.Unwear = (actor) => {
            if (!this.IsWorn) {
                Dooku.IO.Append(
                    `<p>${this.NotWearingMessage}</p>`
                )
                return;
            }
            if (!this.IsWorn && !this.Thing.IsIn(actor)) {
                Dooku.IO.Append(
                    `<p>${this.NotWearingMessage}</p>`
                )
                return;
            }

            Dooku.IO.Append(
                `<p>${this.UnwearMessage}</p>`
            )
            this.IsWorn = false;
        }
    }
    Start() {
        this.Thing.On("OnDrop", (actor) => {
            if (this.IsWorn) {
                Dooku.IO.Append(
                    `<p>First taking it off. </p>`
                )
                this.IsWorn = false;
            }
        })
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
}

const NorthVerb = new TravelVerb();
NorthVerb.Verb = ["north", "n", "go north"];
NorthVerb.Action = (actor) => {
    if (actor) {
        actor.TravelTo(actor.Location.North());
    }
};

const SouthVerb = new TravelVerb();
SouthVerb.Verb = ["south", "s", "go south"];
SouthVerb.Action = (actor) => {
    if (actor) {
        actor.TravelTo(actor.Location.South());
    }
};

const EastVerb = new TravelVerb();
EastVerb.Verb = ["east", "e", "go east"];
EastVerb.Action = (actor) => {
    if (actor) {
        actor.TravelTo(actor.Location.East());
    }
};

const WestVerb = new TravelVerb();
WestVerb.Verb = ["west", "w", "go west"];
WestVerb.Action = (actor) => {
    if (actor) {
        actor.TravelTo(actor.Location.West());
    }
};

const ExamineVerb = new DeepVerb();
ExamineVerb.Verb = ["examine", "x", "look at"];
ExamineVerb.CheckAction = function (actor, thing) {
    if (!thing) {
        Dooku.IO.Append(
            `<p> What do you want to look at? </p>`
        )
        return false;
    }
    if (!thing.IsReachable(actor)) {
        Dooku.IO.Append(
            `<p> You can't reach that </p>`
        )
        return false
    }

    return true;
}
ExamineVerb.Action = (actor, thing) => {
    if (thing) {
        Dooku.IO.Append(
            `<p>${thing.GetDescription()}</p>`
        )
    }
};

const LookVerb = new DeepVerb();
LookVerb.Verb = ["look", "l"];
LookVerb.Action = (actor) => {
    actor.LookAround();
};

Object.assign(Item.prototype, {
    DroppedMessage: `Dropped. `,
    Drop(actor) {
        if (!this.IsIn(actor)) {
            return;
        }
        this.MoveInto(actor.Location);
        Dooku.IO.Append(
            `<p> ${this.DroppedMessage} </p>`
        )
    },
    // Drop on something
    DropOn(actor, onThing) {
        if (!this.IsIn(actor)) {
            return;
        }
        if (!(onThing.Location === actor.Location) && !onThing.IsIn(actor)) {
            return;
        }

        if (!onThing.HasBehaviour("Surface")) {
            return;
        }

        this.MoveInto(onThing);
        Dooku.IO.Append(
            `<p> ${this.DroppedMessage} </p>`
        )
    }
});
const DropVerb = new DeepVerb();
DropVerb.Verb = ["drop", "put down"];
DropVerb.CheckAction = function (actor, item) {
    if (!item) {
        Dooku.IO.Append(
            `<p> What do you want to drop? </p>`
        )
        return false;
    }
    if (!item.IsIn(actor)) {
        Dooku.IO.Append(
            `<p> You don't have it </p>`
        )
        return false
    }

    return true;
}
DropVerb.Action = function (actor, item) {
    item.Drop(actor);
};
DropVerb.OnCheckAction = function (actor, item, thing) {
    if (!(thing.Location === actor.Location) && !thing.IsIn(actor)) {
        Dooku.IO.Append(
            // TODO: Use item name instead of that
            `<p> You don't see that </p>`
        )
        return false;
    }
    if (!thing.HasBehaviour("Surface")) {
        Dooku.IO.Append(
            `<p> You can't put it on that. </p>`
        )
        return false;
    }
    return true;
}
DropVerb.OnAction = function (actor, item, thing) {
    item.DropOn(actor, thing);
}