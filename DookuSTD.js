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

const ExamineVerb = new DeepVerb();
ExamineVerb.Verb = ["examine #Thing?", "x #Thing?", "look at #Thing?"];
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