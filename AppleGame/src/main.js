//Note 2
import "./style.css";
import Phaser from "phaser";

//Size of game Canvas
const sizes = {
  width: 500,
  height: 500,
};

//Our Games Overall Speed
const baseSpeedDown = 450; //base speed
const maxSpeedDown = 1500; //Maximum Fall Speed
const speedIncreaseInterval = 5000; //To increase the speed every 5 seconds
const speedIncreaseAmount = 100; // How much Speed increases with each interval

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
    this.playerSpeed = baseSpeedDown + 130; //Speed the player moves

    //Creation of Apple
    this.target;

    //Score tracker
    this.points = 0;
    this.textScore;
    this.highScore = localStorage.getItem("appleHighScore") || 0;

    //Time Keeper
    this.textTime;
    this.timedEvent;
    this.remainingTime;

    //Game Speed Elements
    this.currentSpeed = baseSpeedDown; //Track Current game speed
    this.speedIncreaseTimer = null; //Timer for speed increases
    this.isTouchActive = false; //Track if touch is currently active
    this.touchStartX = 0; //Starting X position of touch

    //Music
    this.coinMusic;
    this.bgMusic;

    //Particles
    this.emitter;

    //Apple types and thier properties
    this.appleTypes = {
      normal: { key: "apple", points: 1, speed: this.currentSpeed },
      golden: { key: "goldenApple", points: 4, speed: this.currentSpeed * 1.5 },
      rotten: {
        key: "rottenApple",
        points: -5,
        speed: this.currentSpeed * 0.8,
      },
    };
  } //End of constructor

  //Function to preload game assets
  preload() {
    //Images
    this.load.image("bg", "/assets/bg.png");
    this.load.image("goldenApple", "/assets/goldenApple.png");
    this.load.image("rottenApple", "assets/rottenApple.png");
    this.load.image("basket", "/assets/basket.png");
    this.load.image("apple", "/assets/apple.png");
    this.load.image("money", "/assets/money.png");
    //Music
    this.load.audio("coin", "/assets/coin.wav");
    this.load.audio("bgMusic", "/assets/bgMusic.mp3");
    this.load.audio("negative", "assets/negative.mp3");
    this.load.audio("gameOver", "assets/gameOver.mp3");
    this.load.audio("victory", "/assets/victory.wav");
  } //End of preload

  //Function to handle our loaded assets
  create() {
    //Pause the Game (Will start with our Evenet listener)
    this.scene.pause("scene-game");

    //Music/ sounds effects
    this.coinMusic = this.sound.add("coin");
    this.bgMusic = this.sound.add("bgMusic");
    this.bgMusic.play(); //Plays bgm
    this.negativeSound = this.sound.add("negative");
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
    this.target.setMaxVelocity(0, baseSpeedDown); // Prevents Apple fall speed from exceeding speedDown value

    //Check for overlapping
    this.physics.add.overlap(
      this.target,
      this.player,
      this.targetHit,
      null,
      this
    );

    //Setup speed increase timer
    this.speedIncreaseTimer = this.time.addEvent({
      delay: speedIncreaseInterval,
      callback: this.increaseSpeed,
      callbackScope: this,
      loop: true,
    });

    //Creating the player controls
    this.cursor = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      A: Phaser.Input.Keyboard.KeyCodes.A,
      D: Phaser.Input.Keyboard.KeyCodes.D,
    });

    //Touch input handlers (for mobile)
    this.input.on("pointerdown", (pointer) => {
      this.isTouchActive = true;
    });

    this.input.on("pointermove", (pointer) => {
      if (this.isTouchActive) {
        const targetX = pointer.x - this.player.width / 2;
        const clampedX = Phaser.Math.Clamp(
          targetX,
          0,
          sizes.width - this.player.width
        );
        this.player.setX(clampedX);
      }
    });

    this.input.on("pointerup", () => {
      this.isTouchActive = false;
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

    //HighScore tracker
    this.highScoreText = this.add.text(
      10,
      40,
      `High Score: ${this.highScore}`,
      {
        font: "25px Arial",
        fill: "FFD700",
      }
    );

    //Duration of the game
    this.timedEvent = this.time.delayedCall(45000, this.gameOver, [], this);

    //Particles
    this.emitter = this.add.particles(0, 0, "money", {
      speed: 100,
      gravityY: baseSpeedDown - 200,
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
    this.spawnApple();
  } //End of create

  //Spawn rates for the random apples
  spawnApple() {
    const rand = Math.random();
    let type;
    if (rand < 0.15) {
      type = "golden";
    } else if (rand < 0.35) {
      type = "rotten";
    } else {
      type = "normal";
    }
    const appleConfig = this.appleTypes[type];
    this.target.setTexture(appleConfig.key);
    if (type === "golden") {
      this.target.setScale(0.01); // Smaller scale for golden apple
      this.target.body.setSize(780, 780);
      this.target.body.setOffset(-30, -30);
    } else if (type === "rotten") {
      this.target.setScale(0.05); //  scale for rotten apple
      this.target.body.setSize(720, 720);
      this.target.body.setOffset(-30, -30);
    } else {
      this.target.setScale(1); // Normal apple size
      this.target.body.setSize(39, 39); //HitBox Size
    }
    this.target.appleType = type;
    this.target.setMaxVelocity(0, appleConfig.speed);
  }

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
      this.spawnApple(); //Spawns a random Apple
    }

    //Setting the player controls (if using keyboard)
    if (!this.isTouchActive) {
      const { left, right } = this.cursor;
      const { A, D } = this.keys;

      if (left.isDown || A.isDown) {
        this.player.setVelocityX(-this.playerSpeed);
      } else if (right.isDown || D.isDown) {
        this.player.setVelocityX(this.playerSpeed);
      } else {
        this.player.setVelocityX(0);
      }
    }
  } //End of Update

  //Handles Apple Speed Increase
  increaseSpeed() {
    if (this.currentSpeed < maxSpeedDown) {
      this.currentSpeed += speedIncreaseAmount;
      //update physics gravity
      this.physics.world.gravity.y = this.currentSpeed;
      //update apple max velocity
      this.target.setMaxVelocity(0, this.currentSpeed);
      console.log(`Speed increased to: ${this.currentSpeed}`);
    }
  }

  //Function to randomize the X value
  getRandomX() {
    return Math.floor(Math.random() * 480);
  }

  //Function to track collision between apple and basket
  targetHit() {
    const appleType = this.target.appleType || "normal";
    const points = this.appleTypes[appleType].points;

    this.points += points;
    this.textScore.setText(`Score: ${this.points}`);

    if (points > 0) {
      this.coinMusic.play();
      this.emitter.start();
    } else {
      this.negativeSound.play();
      //Red Flash for picking up negative apple
      this.player.setTint(0xff0000);
      this.time.delayedCall(300, () => {
        this.player.clearTint();
      });
    }

    this.target.setY(0);
    this.target.setX(this.getRandomX());
    this.spawnApple();
  }

  //Called when the timer is complete (Aka GameOver lel)
  gameOver() {
    if (this.points >= 30) {
      this.sound.play("victory"); //  victory sound
    } else {
      this.sound.play("gameOver");
    }

    //HighScore Checker
    if (this.points > this.highScore) {
      this.highScore = this.points;
      localStorage.setItem("appleHighScore", this.points);
    }

    this.time.delayedCall(1500, () => {
      this.sys.game.destroy(true);
      gameEndDiv.style.display = "flex";

      if (this.points >= 30) {
        gameEndScoreSpan.textContent = this.points;
        gameWinLoseSpan.textContent = "Win! 🎉";
      } else {
        gameEndScoreSpan.textContent = this.points;
        gameWinLoseSpan.textContent = " Lose (╯°□°）╯︵ ┻━┻ \n Game Over";
      }
    });
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
      gravity: { y: baseSpeedDown },
      debug: false, //Shows hitboxes
    },
  },
  scene: [GameScene],
  input: {
    touch: true, // Enable touch input
  },
};

const game = new Phaser.Game(config);

//Event listener to start the game

gameStartBtn.addEventListener("click", () => {
  gameStartDiv.style.display = "none";
  game.scene.resume("scene-game");
});
