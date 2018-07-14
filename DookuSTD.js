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

    Start () {
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
                // Don't have it in inventory, try to get it???
                // TODO
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
        this.Thing.On("OnDrop" , (actor) => {
            if (this.IsWorn) {
                Dooku.IO.Append (
                    `<p>First taking it off. </p>`
                )
                this.IsWorn = false;
            }
        })
    }
}

const Go = new DeepVerb();
Go.Vocab = {
    go_direction: {
        documents: [
            "go {direction}",
            "{direction}"
        ],
        entities: [{
            entity: "direction",
            id: "direction"
        }]
    }
}
Go.Action = (actor, out) => {
    var direction = out.entitiesIndex.direction.value;
    switch (direction) {
        case "north":
            actor.TravelTo(actor.Location.North());
            break;
        case "south":
            actor.TravelTo(actor.Location.South());
            break;
        case "east":
            actor.TravelTo(actor.Location.East());
            break;
        case "west":
            actor.TravelTo(actor.Location.West());
            break;
    }
}

const Look = new DeepVerb();
Look.Vocab = {
    look_around: {
        documents: [
            "look",
            "look around"
        ],
        entities: []
    }
}
Look.Action = (actor, out) => {
    actor.LookAround();
}

const PutOn = new DeepVerb();
PutOn.Vocab = {
    put_on_thing: {
        documents: [
            "put {item} on {item}",
            "I want to put {item} on {item}"
        ],
        entities: [{
            entity: "item",
            id: "item"
        }, {
            entity: "item",
            id: "item"
        }]
    },
    wear_item: {
        documents: [
            "I want to put on {item}",
            "put on {item}",
            "wear {item}",
            "I wear {item}"
        ],
        entities: [{
            entity: "item",
            id: "item"
        }]
    }
}
PutOn.Action = (actor, out) => {
    if (out.intent === "wear_item") {
        if (out.found <= 0) {
            Dooku.IO.Append(
                `<p>What do you want to wear?</p>`
            )
            return;
        }
        var value = out.entitiesIndex.item.value;
        if (value.HasBehaviour("Wearable"))
            value.GetBehaviour("Wearable").Wear(actor);
        else
            Dooku.IO.Append(
                `<p>You can't wear that</p>`
            )
    }
    else if (out.intent === "put_on_thing") {
        console.log("put on")
    }
}

const TakeOff = new DeepVerb();
TakeOff.Vocab = {
    take_off: {
        documents: [
            "take off {item}",
            "remove {item}",
            "I remove {item}"
        ],
        entities: [{
            entity: "item",
            id: "item"
        }]
    }
}
TakeOff.Action = (actor, out) => {
    if (out.found <= 0) {
        Dooku.IO.Append(
            `<p>What do you want to take off?</p>`
        )
        return;
    }
    var value = out.entitiesIndex.item.value;
    if (value.HasBehaviour("Wearable"))
        value.GetBehaviour("Wearable").Unwear(actor);
    else
        Dooku.IO.Append(
            `<p>You can't take that off</p>`
        )
}

Object.assign(Item.prototype, {
    AlreadyHaveItemMessage: `You already have it.`,
    TakenMessage: `Taken.`,
    Take: function (actor) {
        if (this.Location === actor) {
            Dooku.IO.Append(
                `<p>${this.AlreadyHaveItemMessage}</p>`,
            )

            return;
        }

        if (this.Location != actor.Location) {
            Dooku.IO.Append(
                `<p>You don't see that here</p>`,
            )

            return;
        }

        Dooku.IO.Append(
            `<p>${this.TakenMessage}</p>`,
        )
        this.MoveInto(actor);
    }
});
const Take = new DeepVerb();
Take.Vocab = {
    take_item: {
        documents: [
            "take {item}",
            "I take {item}"
        ],
        entities: [{
            entity: "item",
            id: "item"
        }]
    }
}
Take.Action = (actor, out) => {
    if (out.found <= 0) {
        Dooku.IO.Append(
            `<p>What do you want to take?</p>`
        )
        return;
    }

    var value = out.entitiesIndex.item.value;
    if (value.HasBehaviour("FixedItem")) {
        // Fixed items can not be taken
        Dooku.IO.Append(
            `<p>${value.GetBehaviour("FixedItem").CannotTakeMessage}</p>`
        )
        return;
    }

    value.Take(actor);
}

Object.assign(Item.prototype, {
    NotCarryingMessage: `You are not carrying it. `,
    DroppedMessage: `Dropped. `,
    // Check whether we can drop it
    CheckDrop: function (actor) {
        if (!actor.IsCarrying(this)) {
            Dooku.IO.Append(
                `<p>${this.NotCarryingMessage}</p>`,
            )
            return false;
        }
        return true;
    },
    DoDrop: function (actor) {
        if (!this.CheckDrop(actor)) return;
        this.Trigger("OnDrop", actor);

        this.Drop(actor);
    },
    Drop: function (actor) {
        Dooku.IO.Append(
            `<p>${this.DroppedMessage}</p>`
        )
        this.MoveInto(actor.Location);
    }
});
const Drop = new DeepVerb();
Drop.Vocab = {
    drop_item: {
        documents: [
            "drop {item}",
            "I drop {item}",
            "put down {item}"
        ],
        entities: [{
            entity: "item",
            id: "item"
        }]
    }
}
Drop.Action = (actor, out) => {
    if (out.found <= 0) {
        Dooku.IO.Append(
            `<p>What do you want to drop?</p>`
        )
        return;
    }
    var value = out.entitiesIndex.item.value;
    value.DoDrop(actor);
}
const Inventory = new DeepVerb();
Inventory.Vocab = {
    show_inventory: {
        documents: [
            "show me my inventory",
            "I want to see my inventory",
            "inventory",
            "show me my inv",
            "I want to see my inv",
            "inv",
        ],
        entities: []
    }
}
Inventory.Action = (actor, out) => {
    if (actor.Contents.length > 0) {
        var invStr = "";
        for (var i in actor.Contents) {
            invStr += actor.Contents[i].ADescription;
            // State whether it is worn or not
            if (actor.Contents[i].HasBehaviour("Wearable")) {
                if (actor.Contents[i].GetBehaviour("Wearable").IsWorn) {
                    invStr += " (being worn)"
                }
            }
            // Add comma if not the last item
            if (i != actor.Contents.length - 1) {
                invStr += ", "
            }
        }
        Dooku.IO.Append(
            `<p>You have ${invStr}. </p>`
        )
        return;
    } else {
        Dooku.IO.Append(
            `<p>You don't have anything in your inventory. </p>`
        )
        return;
    }
}
const Search = new DeepVerb({
    search_something: {
        documents: [
            "search {actor}",
            "I want to search {actor}"
        ],
        entities: [{
            entity: "actor",
            id: "actor"
        }]
    }
});
Search.Action = (actor, out) => {
    if (out.found <= 0) {
        Dooku.IO.Append(
            `<p>What do you want to search?</p>`
        )
        return;
    }

    var value = out.entitiesIndex.actor.value;
    if (value.Contents.length > 0) {
        var invStr = "";
        for (var i in value.Contents) {
            invStr += value.Contents[i].ADescription;
            // State whether it is worn or not
            if (value.Contents[i].HasBehaviour("Wearable")) {
                if (value.Contents[i].GetBehaviour("Wearable").IsWorn) {
                    invStr += " (being worn)"
                }
            }
            // Add comma if not the last item
            if (i != value.Contents.length - 1) {
                invStr += ", "
            }
        }
        Dooku.IO.Append(
            `<p>In ${value.ADescription} you see ${invStr}. </p>`
        )
        return;
    } else {
        Dooku.IO.Append(
            `<p>There is nothing in ${value.Name}. </p>`
        )
        return;
    }
}
const Examine = new DeepVerb();
Examine.Vocab = {
    examine_something: {
        documents: [
            "examine {thing}",
            "I want to examine {thing}",
            "I want to x {thing}",
            "x {thing}",
            "I want to look at {thing}",
            "look at {thing}",
            "I want to l at {thing}",
            "l at {thing}",
            "I want to inspect {thing}",
            "inspect {thing}",
        ],
        entities: [{
            entity: "thing",
            id: "thing"
        }]
    }
}
Examine.Action = (actor, out) => {
    if (out.found <= 0) {
        Dooku.IO.Append(
            `<p>What do you want to examine?</p>`
        )
        return;
    }

    var value = out.entitiesIndex.thing.value;
    Dooku.IO.Append(
        `<p>${value.GetDescription()}</p>`
    )
    return;
}