const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

let wordToGuess = "";
let hiddenWord = [];
let attempts = 6;
let guessedLetters = [];
let players = [];

function initializeGame() {
  wordToGuess = generateRandomWord();
  hiddenWord = Array(wordToGuess.length).fill("_");
  attempts = 6;
  guessedLetters = [];
}

function generateRandomWord() {
  const words = ["hangman", "javascript", "nodejs", "socket", "multiplayer"];
  return words[Math.floor(Math.random() * words.length)];
}

function broadcast(message) {
  io.emit("message", message);
}

function sendStatus(socket, code, phrase, message) {
  socket.emit("status", { code, phrase, message });
}

io.on("connection", (socket) => {
  console.log("(200) New client connected");

  players.push(socket);

  if (players.length <= 2) {
    initializeGame();
    broadcast(
      `Game started! Word: ${hiddenWord.join(
        " "
      )}, Attempts left: ${attempts}\n`
    );

    socket.on("guess", (guess) => {
      if (!guessedLetters.includes(guess)) {
        guessedLetters.push(guess);

        if (wordToGuess.includes(guess)) {
          for (let i = 0; i < wordToGuess.length; i++) {
            if (wordToGuess[i] === guess) {
              hiddenWord[i] = guess;
            }
          }

          if (!hiddenWord.includes("_")) {
            broadcast(
              `Congratulations! Player guessed the word: ${wordToGuess}\n`
            );
            sendStatus(
              socket,
              604,
              "Victory",
              `You correctly guesses the word.`
            );
            statusCode = 604;
            console.log(`(${statusCode}) Victory`);
            initializeGame();
            sendStatus(socket, 201, "New Game", `Starts a new game.`);
            statusCode = 201;
            console.log(`(${statusCode}) New Game`);
            broadcast(
              `\nGame started! Word: ${hiddenWord.join(
                " "
              )}, Attempts left: ${attempts}\n`
            );
          } else {
            broadcast(
              `Correct guess! Word: ${hiddenWord.join(
                " "
              )}, Attempts left: ${attempts}\n`
            );
            statusCode = 602;
            console.log(`(${statusCode}) Correct Guess`);
          }
        } else {
          attempts--;
          broadcast(
            `Incorrect guess! Word: ${hiddenWord.join(
              " "
            )}, Attempts left: ${attempts}\n`
          );
          statusCode = 603;
          console.log(`(${statusCode}) Incorrect Guess`);

          if (attempts === 0) {
            broadcast(`Game over! The word was: ${wordToGuess}\n`);
            sendStatus(
              socket,
              605,
              "Defeat",
              `The game ends, no attempts are left`
            );
            statusCode = 605;
            console.log(`(${statusCode}) Defeat`);
            initializeGame();
            sendStatus(socket, 201, "New Game", `Starts a new game.`);
            statusCode = 201;
            console.log(`(${statusCode}) New Game`);
            broadcast(
              `\nGame started! Word: ${hiddenWord.join(
                " "
              )}, Attempts left: ${attempts}\n`
            );
          }
        }
      } else {
        sendStatus(
          socket,
          400,
          "Bad Request",
          `You already guessed "${guess}". Try again.`
        );
        statusCode = 400;
        console.log(`(${statusCode}) Bad Request`);
      }
    });

    socket.on("disconnect", () => {
      console.log("(601) Client disconnected");
      broadcast("Player left the game!");
      players.splice(players.indexOf(socket), 1);
      if (players.length === 1) {
        sendStatus(
          players[0],
          601,
          "Waiting for Opponent",
          "Waiting for another player to join..."
        );
      }
    });
  } else {
    sendStatus(
      socket,
      600,
      "Maximum Players Reached",
      "Please wait for the next round."
    );
    statusCode = 600;
    console.log(`(${statusCode}) Maximum Players Reached`);
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
