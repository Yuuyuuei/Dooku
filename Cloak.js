'use strict';

GameInfo.Name = "Cloak of Darkness"
GameInfo.Description = "A sample game for Dooku";
GameInfo.Intro = "Hurrying through the rainswept November night, you're glad to see the bright lights of the Opera House. It's surprising that there aren't more people about but, hey, what do you expect in a cheap demo game...?"
GameInfo.Author = "Yuuyu";
GameInfo.AuthorEmail = "eugene@eugenetan.co.uk";
GameInfo.Version = "1.0.0";

Global.Set("Score", 0);
Global.Set("MaxScore", 2);

const Player = new Actor();
Player.Name = "You";
Player.Entities = ["me", "you", "myself"];
Player.ADescription = "yourself";
Player.TheDescription = "yourself";
Player.Description = "You look the same as always. ";

const Cloak = new Item();
Cloak.Name = "velvet cloak";
Cloak.Entities = ["cloak"];
Cloak.ADescription = `a ${Cloak.Name}`;
Cloak.TheDescription = `the ${Cloak.Name}`;
Cloak.Description = "A handsome cloak, of velvet trimmed with satin, and slightly spattered with raindrops. Its blackness is so deep that it almost seems to suck light from the room.";
Cloak.AddBehaviour(new Wearable()).IsWorn = true;
// Override default drop action to not allowing drop
Cloak.Drop = function (actor) {
    if (actor.Location === Cloakroom) {
        Dooku.IO.Append(
            `<p>Why put it on the floor when there's a perfectly good hook!</p>`,
        )
    } else {
        Dooku.IO.Append(
            `<p>This isn't the best place to leave a smart cloak lying around.</p>`,
        )
    }
}
Cloak.MoveInto(Player);

const Foyer = new Room();
Foyer.Name = "Foyer of the Opera House";
Foyer.Description = "You are standing in a spacious hall, splendidly decorated in red and gold, with glittering chandeliers overhead. The entrance from the street is to the north, and there are doorways south and west."
Foyer.North = () => {
    return "You've only just arrived, and besides, the weather outside seems to be getting worse. ";
};
Foyer.West = () => {
    return Cloakroom;
};
Foyer.South = () => {
    return Bar;
};

const Cloakroom = new Room();
Cloakroom.Name = "Cloakroom";
Cloakroom.Description = "The walls of this small room were clearly once lined with hooks, though now only one remains. The exit is a door to the east."
Cloakroom.East = () => {
    return Foyer;
};

const Hook = new Item();
Hook.Name = "small brass hook";
Hook.Entities = ["hook"];
Hook.Description = () => {
    return `It's just a small brass hook, ${Cloak.IsIn(Hook) ? `with a cloak hanging on it. ` : `screwed to the wall. `}`;
}
Hook.AddBehaviour(new FixedItem());
Hook.MoveInto(Cloakroom);

const Bar = new Room();
Bar.Name = "Foyer Bar";
Bar.Description = "The bar, much rougher than you'd have guessed after the opulence of the foyer to the north, is completely empty. There seems to be some sort of message scrawled in the sawdust on the floor."
Bar.CheckVerb = (vocab, out) => {
    if (!Bar.GetBehaviour("LitRoom").IsLit()) {
        if (out.intent === "go_direction") {
            if (out.entitiesIndex.direction.value != "north") {
                Dooku.IO.Append(
                    `<p>Blundering around in the dark isn't a good idea!</p>`
                );
                return false;
            }
        }
        // TODO: Make sure it is NOT system verb like SAVE or LOAD
        else if (true) {
            if (out.intent === "look_around") {
                Dooku.IO.Append(
                    `<p>Its too dark to look around!</p>`
                );
                return false;
            }
            Dooku.IO.Append(
                `<p>In the dark? You could easily disturb something!</p>`
            );
            return false;
        }
    }
    return true;
}
Bar.North = () => {
    return Foyer;
};
// Can only see if the cloak is not on the player
Bar.AddBehaviour(new LitRoom()).LightsOn = () => {
    return !Cloak.IsIn(Player);
};

// const TestLamp = new Item();
// TestLamp.Name = "Test Lamp";
// TestLamp.Description = "Just a test lamp"
// TestLamp.AddBehaviour(new LightSource()).TurnOn();
// TestLamp.MoveInto(Bar);

var input = $('#input-container');
var output = $('#output-container');
Dooku.IO.Attach(input, output);

Dooku.Start(() => {
    // Possess the player
    Actor.Possess(Player);

    // Move it into our starting room
    Player.MoveInto(Foyer);

    GameInfo.Show();
});