import "./style.css";
import Phaser from "phaser";

//Size of game Canvas
const sizes = {
  width: 500,
  height: 500,
};

//Our Games Overall Speed
const speedDown = 750;

//The html id's
const gameStartDiv = document.querySelector("#gameStartDiv");
const gameStartBtn = document.querySelector("#gameStartBtn");
const gameEndDiv = document.querySelector("#gameEndDiv");
const gameWinLoseSpan = document.querySelector("#gameWinLoseSpan");
const gameEndScoreSpan = document.querySelector("#gameEndScoreSpan");

//Were the Game Magic Happens!
class GameScene extends Phaser.Scene {
  constructor() {
    super("scene-game");
    this.player; //Player Variable

    //Setting up player controls
    this.cursor;
    this.playerSpeed = speedDown + 130; //Speed the player moves

    //Creation of Apple
    this.target;

    //Score tracker
    this.points = 0;
    this.textScore;

    //Time Keeper
    this.textTime;
    this.timedEvent;
    this.remainingTime;

    //Music
    this.coinMusic;
    this.bgMusic;

    //Particles
    this.emitter;
  } //End of constructor

  //Function to preload game assets
  preload() {
    //Images
    this.load.image("bg", "/assets/bg.png");
    this.load.image("basket", "/assets/basket.png");
    this.load.image("apple", "/assets/apple.png");
    this.load.image("money", "/assets/money.png");
    //Music
    this.load.audio("coin", "/assets/coin.mp3");
    this.load.audio("bgMusic", "/assets/bgMusic.mp3");
  } //End of preload

  //Function to handle our loaded assets
  create() {
    //Pause the Game (Will start with our Evenet listener)
    this.scene.pause("scene-game");

    //Music
    this.coinMusic = this.sound.add("coin");
    this.bgMusic = this.sound.add("bgMusic");
    this.bgMusic.play(); //Plays bgm
    // this.bgMusic.stop(); //Stops the bgm

    // Player Physics
    this.add.image(0, 0, "bg").setOrigin(0, 0);
    this.player = this.physics.add
      .image(0, sizes.height - 100, "basket")
      .setOrigin(0, 0);
    this.player.setImmovable(true); //Prevents player from being moved by other sprites
    this.player.body.allowGravity = false;
    this.player.setCollideWorldBounds(true); //Prevents Player from leaving world boundary

    //Cleanup so the apple falls in the basket, not ontop
    this.player
      .setSize(
        this.player.width - this.player.width / 4,
        this.player.height / 6
      )
      .setOffset(
        this.player.width / 10,
        this.player.height - this.player.height / 10
      );

    //Apple Physics
    this.target = this.physics.add.image(0, 0, "apple").setOrigin(0, 0);
    this.target.setMaxVelocity(0, speedDown); // Prevents Apple fall speed from exceeding speedDown value

    //Check for overlapping
    this.physics.add.overlap(
      this.target,
      this.player,
      this.targetHit,
      null,
      this
    );

    //Creating the player controls
    this.cursor = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      A: Phaser.Input.Keyboard.KeyCodes.A,
      D: Phaser.Input.Keyboard.KeyCodes.D,
    });

    //Score Keeper
    this.textScore = this.add.text(sizes.width - 120, 10, "Score:0", {
      font: "25px Arial",
      fill: "#000000",
    });

    //Time Keeper
    this.textTime = this.add.text(10, 10, "Remaining Time: 00", {
      font: "25px Arial",
      fill: "#000000",
    });
    //Duration of the game
    this.timedEvent = this.time.delayedCall(30000, this.gameOver, [], this);

    //Particles
    this.emitter = this.add.particles(0, 0, "money", {
      speed: 100,
      gravityY: speedDown - 200,
      scale: 0.04,
      duration: 100,
      emitting: false, // Set to false, so we can active it when we want in another function
    });
    //Have Particles Follow the player
    this.emitter.startFollow(
      this.player,
      this.player.width / 2,
      this.player.height / 2,
      true
    );
  } //End of create

  //Function to update game events, (runs continuously)
  update() {
    //Timer/Duration of the game
    this.remainingTime = this.timedEvent.getRemainingSeconds();
    this.textTime.setText(
      `Remaining Time: ${Math.round(this.remainingTime).toString()}`
    );

    //Increases Apple's descent Speed
    if (this.target.y >= sizes.height) {
      this.target.setY(0);
      this.target.setX(this.getRandomX()); //Randomize Apple X location after each fall
    }

    //Setting the player controls
    const { left, right } = this.cursor;
    const { A, D } = this.keys;

    if (left.isDown || A.isDown) {
      this.player.setVelocityX(-this.playerSpeed);
    } else if (right.isDown || D.isDown) {
      this.player.setVelocityX(this.playerSpeed);
    } else {
      this.player.setVelocityX(0);
    }
  } //End of Update

  //Function to randomize the X value
  getRandomX() {
    return Math.floor(Math.random() * 480);
  }

  //Function to track collision between apple and basket
  targetHit() {
    this.coinMusic.play(); // Plays coin sound effect when collision triggers
    this.emitter.start();
    this.target.setY(0);
    this.target.setX(this.getRandomX());
    this.points++;
    this.textScore.setText(`Score: ${this.points}`);
  }

  //Called when the timer is complete (Aka GameOver lel)
  gameOver() {
    this.sys.game.destroy(true);
    console.log("Game Over 🎉");

    if (this.points >= 30) {
      gameEndScoreSpan.textContent = this.points;
      gameWinLoseSpan.textContent = "Win! 🎉";
    } else {
      gameEndScoreSpan.textContent = this.points;
      gameWinLoseSpan.textContent = " Lose (╯°□°）╯︵ ┻━┻ \n Game Over";
    }

    gameEndDiv.style.display = "flex";
  }
} //End of Game Scene

//Defining our Canvas for the type of game we want to create
const config = {
  type: Phaser.WEBGL,
  width: sizes.width,
  height: sizes.height,
  canvas: gameCanvas,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: speedDown },
      debug: false, //Shows hitboxes
    },
  },
  scene: [GameScene],
};

const game = new Phaser.Game(config);

//Event listener to start the game

gameStartBtn.addEventListener("click", () => {
  gameStartDiv.style.display = "none";
  game.scene.resume("scene-game");
});
