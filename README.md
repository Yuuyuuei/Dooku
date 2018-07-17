# Dooku

Dooku is an interactive fiction constructing engine written in JavaScript (Utilizes Electron, BootStrap and JQuery). It uses [CompromiseJS](https://github.com/spencermountain/compromise) to match user inputs to a verb (Very much spaghetti code). 
All you need is Dooku and DookuSTD. Please see below for a "getting started".

**Clone and run using Electron to see a demo in action**

The demo game is Cloak of Darkness, the interactive fiction equivalent of "Hello, world!".

```bash
# Clone this repository
git clone https://github.com/Yuuyuuei/Dooku
# Go into the repository
cd Dooku
# Install dependencies
npm install
# Run the app
npm start
```

## Getting Started

You simple need Dooku.js and DookuSTD.js before your own script.

```bash
# Include Dooku libraries (and JQuery and CompromiseJS)
<script
  src="https://code.jquery.com/jquery-3.3.1.min.js"
  integrity="sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8="
  crossorigin="anonymous"></script>
<script src="https://unpkg.com/compromise@latest/builds/compromise.min.js"></script>
<script type="text/javascript" src="Dooku.js"></script>
<script type="text/javascript" src="DookuSTD.js"></script>
<script type="text/javascript" src="YOUR-SCRIPT.js"></script>

# Set up and output container and an input field
<div id="output-container"></div>
<form id="input-container">
    <input type="text">
</form>

# In your own JavaScript
var input = $('#input-container');
var output = $('#output-container');
Dooku.IO.Attach(input, output);     # Attach input and output to Dooku

# Begin the game
GameInfo.Name = "Game Name"
GameInfo.Description = "A sample game";
GameInfo.Intro = "Something happened that lead up to this sample game..."
GameInfo.Author = "You";
GameInfo.AuthorEmail = "you@yourdomain.com";
GameInfo.Version = "1.0.0";

const Player = new Actor();
Player.Name = "You";
Player.Noun = ["me", "you", "myself"];
Player.ADescription = "yourself";
Player.TheDescription = "yourself";
Player.Description = "You look the same as always. ";

const FirstRoom = new Room();
FirstRoom.Name = "FirstRoom";
FirstRoom.Description = "Its a big room for a first room..."

Dooku.Start(() => {
    // Possess the player
    Actor.Possess(Player);

    // Move it into our starting room
    Player.MoveInto(FirstRoom);

    GameInfo.Show();
});
```

## What can you do with Dooku?

Dooku is still under-construction and I'm adding more and more to it as I go along. Please check the source at Cloak.js.

## License

[MIT](LICENSE.md)
