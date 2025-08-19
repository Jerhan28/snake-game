    var Snake = (function () {
      const INITIAL_TAIL = 4;
      var fixedTail = false;

      var intervalID;
      var gameSpeed = 10;
      var gameActive = true;

      var tileCount = 20;
      var gridSize = 400/tileCount;

      const INITIAL_PLAYER = { x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2) };

      var velocity = { x:0, y:0 };
      var player = { x: INITIAL_PLAYER.x, y: INITIAL_PLAYER.y };

      var walls = false;

      var fruit = { x:1, y:1 };

      var trail = [];
      var tail = INITIAL_TAIL;

      var reward = 0;
      var points = 0;
      var pointsMax = 0;

      var ActionEnum = { 'none':0, 'up':1, 'down':2, 'left':3, 'right':4 };
      Object.freeze(ActionEnum);
      var lastAction = ActionEnum.none;

      function setup () {
        canv = document.getElementById('gc');
        ctx = canv.getContext('2d');

        game.reset();
        updateScoreDisplay();
        loadSettings();
      }

      function updateScoreDisplay() {
        document.getElementById('current-score').textContent = `Score: ${points}`;
        document.getElementById('high-score').textContent = `High Score: ${pointsMax}`;
      }

      function showGameOver(message) {
        gameActive = false;
        document.getElementById('gameOverMessage').textContent = message;
        document.getElementById('gameOver').classList.add('active');
      }

      function hideGameOver() {
        gameActive = true;
        document.getElementById('gameOver').classList.remove('active');
      }

      function saveSettings() {
        const settings = {
          walls: walls,
          fixedTail: fixedTail,
          gameSpeed: gameSpeed,
          tileCount: tileCount,
          keyboard: document.getElementById('keyboardToggle').checked
        };
        localStorage.setItem('snakeGameSettings', JSON.stringify(settings));
      }

      function loadSettings() {
        const savedSettings = localStorage.getItem('snakeGameSettings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          walls = settings.walls;
          fixedTail = settings.fixedTail;
          gameSpeed = settings.gameSpeed;
          tileCount = settings.tileCount;
          
          document.getElementById('wallToggle').checked = walls;
          document.getElementById('growthToggle').checked = !fixedTail;
          document.getElementById('speedSelect').value = gameSpeed;
          document.getElementById('gridSelect').value = tileCount;
          document.getElementById('keyboardToggle').checked = settings.keyboard;
          
          // Update game with loaded settings
          Snake.setup.wall(walls);
          Snake.setup.fixedTail(fixedTail);
          Snake.setup.tileCount(tileCount);
          Snake.setup.keyboard(settings.keyboard);
          
          // Restart game with new speed
          Snake.stop();
          Snake.start(gameSpeed);
        }
      }

      var game = {
        reset: function () {
          hideGameOver();
          ctx.fillStyle = '#0a192f';
          ctx.fillRect(0, 0, canv.width, canv.height);

          tail = INITIAL_TAIL;
          points = 0;
          velocity.x = 0;
          velocity.y = 0;
          player.x = INITIAL_PLAYER.x;
          player.y = INITIAL_PLAYER.y;
          game.RandomFruit();
          reward = -1;

          lastAction = ActionEnum.none;

          trail = [];
          trail.push({ x: player.x, y: player.y });
          
          updateScoreDisplay();
        },

        action: {
          up: function () {
            if (gameActive && lastAction != ActionEnum.down){
              velocity.x = 0;
              velocity.y = -1;
            }
          },
          down: function () {
            if (gameActive && lastAction != ActionEnum.up){
              velocity.x = 0;
              velocity.y = 1;
            }
          },
          left: function () {
            if (gameActive && lastAction != ActionEnum.right){
              velocity.x = -1;
              velocity.y = 0;
            }
          },
          right: function () {
            if (gameActive && lastAction != ActionEnum.left){
              velocity.x = 1;
              velocity.y = 0;
            }
          }
        },

        RandomFruit: function () {
          if(walls){
            fruit.x = 1+Math.floor(Math.random() * (tileCount-2));
            fruit.y = 1+Math.floor(Math.random() * (tileCount-2));
          }
          else {
            fruit.x = Math.floor(Math.random() * tileCount);
            fruit.y = Math.floor(Math.random() * tileCount);
          }
        },

        loop: function () {
          if (!gameActive) return;

          reward = -0.1;

          function DontHitWall () {
            if(player.x < 0) player.x = tileCount-1;
            if(player.x >= tileCount) player.x = 0;
            if(player.y < 0) player.y = tileCount-1;
            if(player.y >= tileCount) player.y = 0;
          }
          
          function HitWall () {
            if(player.x < 1 || player.x > tileCount-2 || player.y < 1 || player.y > tileCount-2) {
              showGameOver("You hit the wall!");
              return true;
            }
            
            ctx.fillStyle = 'rgba(30, 42, 58, 0.7)';
            ctx.fillRect(0,0,gridSize-1,canv.height);
            ctx.fillRect(0,0,canv.width,gridSize-1);
            ctx.fillRect(canv.width-gridSize+1,0,gridSize,canv.height);
            ctx.fillRect(0, canv.height-gridSize+1,canv.width,gridSize);
            return false;
          }

          var stopped = velocity.x == 0 && velocity.y == 0;

          player.x += velocity.x;
          player.y += velocity.y;

          if (velocity.x == 0 && velocity.y == -1) lastAction = ActionEnum.up;
          if (velocity.x == 0 && velocity.y == 1) lastAction = ActionEnum.down;
          if (velocity.x == -1 && velocity.y == 0) lastAction = ActionEnum.left;
          if (velocity.x == 1 && velocity.y == 0) lastAction = ActionEnum.right;

          // Draw game background
          ctx.fillStyle = '#0a192f';
          ctx.fillRect(0,0,canv.width,canv.height);

          if(walls) {
            if (HitWall()) return;
          } else {
            DontHitWall();
          }

          if (!stopped){
            trail.push({x:player.x, y:player.y});
            while(trail.length > tail) trail.shift();
          }

          // Draw snake body with segments
          for(var i=0; i<trail.length; i++) {
            var segmentColor;
            var segmentSize = gridSize;
            
            // Head (last segment)
            if (i === trail.length - 1) {
              segmentColor = '#64ffda'; // Bright teal for head
              segmentSize = gridSize * 1.1;
              
              // Draw eyes on head
              ctx.fillStyle = '#0a192f';
              
              // Left eye
              var eyeX = trail[i].x * gridSize + gridSize * 0.3;
              var eyeY = trail[i].y * gridSize + gridSize * 0.3;
              if (velocity.x === 1) { // Right
                eyeX = trail[i].x * gridSize + gridSize * 0.7;
                eyeY = trail[i].y * gridSize + gridSize * 0.3;
              } else if (velocity.x === -1) { // Left
                eyeX = trail[i].x * gridSize + gridSize * 0.3;
                eyeY = trail[i].y * gridSize + gridSize * 0.3;
              } else if (velocity.y === -1) { // Up
                eyeX = trail[i].x * gridSize + gridSize * 0.3;
                eyeY = trail[i].y * gridSize + gridSize * 0.3;
              } else if (velocity.y === 1) { // Down
                eyeX = trail[i].x * gridSize + gridSize * 0.3;
                eyeY = trail[i].y * gridSize + gridSize * 0.7;
              }
              
              ctx.beginPath();
              ctx.arc(eyeX, eyeY, gridSize * 0.1, 0, Math.PI * 2);
              ctx.fill();
              
              // Right eye
              eyeX = trail[i].x * gridSize + gridSize * 0.7;
              eyeY = trail[i].y * gridSize + gridSize * 0.3;
              if (velocity.x === 1) { // Right
                eyeX = trail[i].x * gridSize + gridSize * 0.7;
                eyeY = trail[i].y * gridSize + gridSize * 0.7;
              } else if (velocity.x === -1) { // Left
                eyeX = trail[i].x * gridSize + gridSize * 0.3;
                eyeY = trail[i].y * gridSize + gridSize * 0.7;
              } else if (velocity.y === -1) { // Up
                eyeX = trail[i].x * gridSize + gridSize * 0.7;
                eyeY = trail[i].y * gridSize + gridSize * 0.3;
              } else if (velocity.y === 1) { // Down
                eyeX = trail[i].x * gridSize + gridSize * 0.7;
                eyeY = trail[i].y * gridSize + gridSize * 0.7;
              }
              
              ctx.beginPath();
              ctx.arc(eyeX, eyeY, gridSize * 0.1, 0, Math.PI * 2);
              ctx.fill();
            } 
            // Tail segments
            else {
              // Color gradient from head to tail
              var colorRatio = i / trail.length;
              var r = Math.floor(100 + (0 * colorRatio));
              var g = Math.floor(255 - (55 * colorRatio));
              var b = Math.floor(218 - (118 * colorRatio));
              segmentColor = `rgb(${r}, ${g}, ${b})`;
            }
            
            ctx.fillStyle = segmentColor;
            ctx.beginPath();
            
            // Rounder segments for smoother look
            var posX = trail[i].x * gridSize + gridSize/2;
            var posY = trail[i].y * gridSize + gridSize/2;
            var radius = segmentSize/2 - 1;
            
            // Make head slightly larger
            if (i === trail.length - 1) {
              radius = segmentSize/2 * 1.1 - 1;
            }
            
            ctx.arc(posX, posY, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Check for collision with body
            if (!stopped && i < trail.length - 1 && trail[i].x == player.x && trail[i].y == player.y){
              showGameOver("You hit yourself!");
              return;
            }
          }

          // Draw fruit with more details
          ctx.fillStyle = '#FF5555';
          ctx.beginPath();
          ctx.arc(
            fruit.x * gridSize + gridSize/2, 
            fruit.y * gridSize + gridSize/2, 
            gridSize/2 - 2, 
            0, 
            Math.PI * 2
          );
          ctx.fill();
          
          // Fruit highlight
          ctx.fillStyle = '#FF8888';
          ctx.beginPath();
          ctx.arc(
            fruit.x * gridSize + gridSize/3, 
            fruit.y * gridSize + gridSize/3, 
            gridSize/6, 
            0, 
            Math.PI * 2
          );
          ctx.fill();

          if (player.x == fruit.x && player.y == fruit.y) {
            if(!fixedTail) tail++;
            points++;
            if(points > pointsMax) pointsMax = points;
            reward = 1;
            game.RandomFruit();
            updateScoreDisplay();
            
            // make sure new fruit didn't spawn in snake tail
            while((function () {
              for(var i=0; i<trail.length; i++) {
                if (trail[i].x == fruit.x && trail[i].y == fruit.y) {
                  game.RandomFruit();
                  return true;
                }
              }
              return false;
            })());
          }

          if(stopped) {
            ctx.fillStyle = 'rgba(100, 255, 218, 0.8)';
            ctx.font = "bold 16px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("Press arrow keys or tap buttons to start", canv.width/2, canv.height/2);
            ctx.textAlign = "left";
          }

          return reward;
        }
      }

      function keyPush (evt) {
        switch(evt.keyCode) {
          case 37: //left
          game.action.left();
          evt.preventDefault();
          break;

          case 38: //up
          game.action.up();
          evt.preventDefault();
          break;

          case 39: //right
          game.action.right();
          evt.preventDefault();
          break;

          case 40: //down
          game.action.down();
          evt.preventDefault();
          break;

          case 32: //space
          Snake.pause();
          evt.preventDefault();
          break;

          case 27: //esc
          game.reset();
          evt.preventDefault();
          break;
        }
      }

      return {
        start: function (fps = 10) {
          gameSpeed = fps;
          window.onload = setup;
          intervalID = setInterval(game.loop, 1000 / fps);
        },

        loop: game.loop,

        reset: function() {
          game.reset();
        },

        stop: function () {
          clearInterval(intervalID);
        },

        setup: {
          keyboard: function (state) {
            if (state) {
              document.addEventListener('keydown', keyPush);
            } else {
              document.removeEventListener('keydown', keyPush);
            }
          },
          wall: function (state) {
            walls = state;
            saveSettings();
          },
          fixedTail: function (state) {
            fixedTail = state;
            saveSettings();
          },
          tileCount: function (size) {
            tileCount = size;
            gridSize = 400 / tileCount;
            saveSettings();
          }
        },

        action: function (act) {
          switch(act) {
            case 'left':
              game.action.left();
              break;

            case 'up':
              game.action.up();
              break;

            case 'right':
              game.action.right();
              break;

            case 'down':
              game.action.down();
              break;
          }
        },

        pause: function () {
          if (!gameActive) return;
          
          if (velocity.x === 0 && velocity.y === 0) {
            // If already paused, resume with last direction
            if (lastAction === ActionEnum.up) game.action.up();
            else if (lastAction === ActionEnum.down) game.action.down();
            else if (lastAction === ActionEnum.left) game.action.left();
            else if (lastAction === ActionEnum.right) game.action.right();
          } else {
            velocity.x = 0;
            velocity.y = 0;
          }
        },

        clearTopScore: function () {
          pointsMax = 0;
          updateScoreDisplay();
        },

        data: {
          player: player,
          fruit: fruit,
          trail: function () {
            return trail;
          }
        },

        info: {
          tileCount: tileCount
        }
      };
    })();

    // Settings panel functionality
    document.getElementById('settingsBtn').addEventListener('click', function() {
      document.getElementById('settingsPanel').classList.add('open');
      document.getElementById('settingsOverlay').classList.add('active');
    });

    document.getElementById('closeSettings').addEventListener('click', function() {
      document.getElementById('settingsPanel').classList.remove('open');
      document.getElementById('settingsOverlay').classList.remove('active');
    });

    document.getElementById('settingsOverlay').addEventListener('click', function() {
      document.getElementById('settingsPanel').classList.remove('open');
      this.classList.remove('active');
    });

    // Settings controls
    document.getElementById('wallToggle').addEventListener('change', function() {
      Snake.setup.wall(this.checked);
    });

    document.getElementById('growthToggle').addEventListener('change', function() {
      Snake.setup.fixedTail(!this.checked);
    });

    document.getElementById('speedSelect').addEventListener('change', function() {
      const newSpeed = parseInt(this.value);
      Snake.stop();
      Snake.start(newSpeed);
    });

    document.getElementById('gridSelect').addEventListener('change', function() {
      const newSize = parseInt(this.value);
      Snake.setup.tileCount(newSize);
      Snake.reset();
    });

    document.getElementById('keyboardToggle').addEventListener('change', function() {
      Snake.setup.keyboard(this.checked);
      saveSettings();
    });

    // Initialize the game
    Snake.start(10);
    Snake.setup.keyboard(true);
    Snake.setup.fixedTail(false);