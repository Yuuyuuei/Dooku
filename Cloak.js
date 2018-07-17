'use strict';

GameInfo.Name = "Cloak of Darkness"
GameInfo.Description = "A sample game for Dooku";
GameInfo.Intro = "Hurrying through the rainswept November night, you're glad to see the bright lights of the Opera House. It's surprising that there aren't more people about but, hey, what do you expect in a cheap demo game...?"
GameInfo.Author = "Yuuyu";
GameInfo.AuthorEmail = "eugene@eugenetan.co.uk";
GameInfo.Version = "1.0.0";

Global.Set("Score", 0);
Global.Set("MaxScore", 2);

PutVerb.Verb.push("hang");

const Player = new Actor();
Player.Name = "You";
Player.Noun = ["me", "you", "myself"];
Player.ADescription = "yourself";
Player.TheDescription = "yourself";
Player.Description = "You look the same as always. ";

const Cloak = new Item();
Cloak.Name = "velvet cloak";
Cloak.Noun = ["cloak"];
Cloak.ADescription = `a ${Cloak.Name}`;
Cloak.TheDescription = `the ${Cloak.Name}`;
Cloak.Description = "A handsome cloak, of velvet trimmed with satin, and slightly spattered with raindrops. Its blackness is so deep that it almost seems to suck light from the room.";
Cloak.AddBehaviour(new Wearable()).IsWorn = true;
// Override default drop action to not allowing drop
Cloak.CheckDrop = function (actor) {
    if (actor.Location === Cloakroom) {
        Dooku.IO.Append(
            `Why put it on the floor when there's a perfectly good hook!`,
        )
        return false;
    } else {
        Dooku.IO.Append(
            `This isn't the best place to leave a smart cloak lying around.`,
        )
        return false;
    }

    return true;
}
Cloak.On("OnPut", function (actor, onThing) {
    if (onThing === Hook) {
        Global.Score += 1;
    }
});
Cloak.MoveInto(Player);

const Foyer = new Room();
Foyer.Name = "Foyer of the Opera House";
Foyer.Description = function (a) {
    return "You are standing in a spacious hall, splendidly decorated in red and gold, with glittering chandeliers overhead. The entrance from the street is to the north, and there are doorways south and west."
}
Foyer.North = "You've only just arrived, and besides, the weather outside seems to be getting worse. ";
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
};;

const Hook = new Item();
Hook.Name = "small brass hook";
Hook.Noun = ["hook"];
Hook.Description = function () {
    return `It's just a small brass hook, ${Cloak.IsIn(this) ? `with a cloak hanging on it. ` : `screwed to the wall. `}`;
}
Hook.AddBehaviour(new FixedItem());
Hook.AddBehaviour(new Surface());
Hook.MoveInto(Cloakroom);

const Bar = new Room();
Bar.Name = "Foyer Bar";
Bar.Description = "The bar, much rougher than you'd have guessed after the opulence of the foyer to the north, is completely empty. There seems to be some sort of message scrawled in the sawdust on the floor."
Bar.CheckVerb = function (verb, ...args) {
    if (!this.GetBehaviour("LitRoom").IsLit()) {
        if (verb instanceof TravelVerb) {
            if (verb != NorthVerb) {
                Dooku.IO.Append(
                    `Blundering around in the dark isn't a good idea!`
                )
                Message.Number += 2;
                return false;
            }
        } else if (!(verb instanceof SysVerb)) {
            Dooku.IO.Append(
                `In the dark? You could easily disturb something!`
            )
            Message.Number += 1;
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

const Message = new Item();
Message.Name = "scrawled message";
Message.Number = 0;
Message.Description = function () {
    if (this.Number < 2) {
        Global.Score += 1;
        Dooku.IO.Append(`The message, neatly marked in the sawdust, reads...`);
        EndGame(true); // this function will print "you have won" and quit.
    } else {
        Dooku.IO.Append(`The message has been carelessly trampled, making it difficult to read. You can just distinguish the words...`);
        EndGame(false); // this function will print "you have lost" and quit.
    }

    return null;
};
Message.Noun = ["message"]
Message.AddBehaviour(new Readable()).Message = function () {
    return this.Thing.Description();
}
Message.MoveInto(Bar);

function EndGame(won) {
    if (won) {
        Dooku.IO.Append(`*** You have won ***`);
    } else {
        Dooku.IO.Append(`*** You have lost ***`);
    }
    Dooku.Quit(() => {
        Dooku.IO.Append(`In a total of 4 turns, you have achieved a score of ${Global.Score} points out of a possible ${Global.MaxScore} .`);
    })
}

// const TestLamp = new Item();
// TestLamp.Name = "Test Lamp";
// TestLamp.Description = "Just a test lamp"
// TestLamp.AddBehaviour(new LightSource()).TurnOn();
// TestLamp.MoveInto(Bar);

// const TestBall = new Item();
// TestBall.Name = "Test Ball";
// TestBall.Description = "Just a test ball"
// TestBall.Noun = ["ball"]
// TestBall.MoveInto(Player);

// const TestTable = new Item();
// TestTable.Name = "Table";
// TestTable.Description = "Just a table"
// TestTable.Noun = ["table"]
// TestTable.AddBehaviour(new Surface());  // Indicates that items can be put on it
// TestTable.MoveInto(Foyer);

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