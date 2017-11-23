var game = function() {
	// Set up an instance of the Quintus engine and include
	// the Sprites, Scenes, Input and 2D module. The 2D module
	// includes the `TileLayer` class as well as the `2d` componet.
	var Q = window.Q = Quintus({ audioSupported: [ 'ogg', 'mp3' ]})
		 .include("Sprites, Scenes, Input, 2D, TMX, Anim, Touch, UI, Audio")
		 // Maximize this game to whatever the size of the browser is
		 .setup({ maximize: true })
		 // And turn on default input controls and touch input (for UI)
		 .controls().touch().enableSound();
	var levelwin = false;
	var currentLevel = 1;
	var lost = false;
	
	Q.state.set({coins: 0, lives: 3});
	Q.state.on("change.coins, change.lives", function(){Q.stageScene("HUD", 1, {label: "Lives: "+Q.state.get("lives")+"	Coins: "+Q.state.get("coins")});});
	
	
	Q.load(["mario_small.png","mario_small.json","bloopa.png", "mainTitle.png",
				"bloopa.json","goomba.png","goomba.json", "princess.png", 
					"coin.png", "coin.json", "music_main.mp3", "coin.mp3", "music_die.mp3"], function(){
		Q.compileSheets("mario_small.png","mario_small.json");
		Q.compileSheets("bloopa.png","bloopa.json");
		Q.compileSheets("goomba.png","goomba.json");
		Q.compileSheets("coin.png", "coin.json");
		Q.audio.play("music_main.mp3",{ loop: true });
	});
	
	//------------MARIO
	//-----------------------------------------------------
	//-----------------------------------------------------
	Q.Sprite.extend("Mario", {
	  
	  init: function(p) {
		this._super(p, {
			sprite: "mario anim",
			sheet: "marioR",
			x: 150,
			y: 280,
			vx:200,
			jumpSpeed: -500,
			dead: false
		});
		this.add('2d, platformerControls, animation');
	  },
	  
	  step: function(dt) {
		if(this.p.y > 600 && !this.p.dead){
			this.death();
		}
		if(!this.p.dead){
			
			if(this.p.direction == "right"){
				if(this.p.vx != 0 && this.p.vy == 0){
					this.play("run_right");
				}else if (this.p.vy != 0){
					this.play("jump_right");
				}else {
					this.play("stand_right");
				}
			}else{
				if(this.p.vx != 0 && this.p.vy == 0){
					this.play("run_left");
				}else if (this.p.vy != 0){
					this.play("jump_left");
				}else {
					this.play("stand_left");
				}
			}
		}
	  },
	  
	  death: function(){
		if(!levelwin && !this.p.dead)
			Q.audio.stop("");
			Q.audio.play("music_die.mp3");
			this.del('platformerControls');
			this.p.vx = 0;
			this.p.vy = -400;
			this.play("dead_"+this.p.direction);
			this.p.dead = true;
			var self = this;
			Q.state.inc("lives", -1);
			if(Q.state.get("lives")<0){
				lost = true;
				Q.stageScene("endGame", 1, {label: "GAME OVER"});
			}
			else{
				Q.stageScene("endGame", 1, {label: "You died"});
			}
			setTimeout(function(){self.destroy();}, 1000);
	  },
	  
	});
	Q.animations('mario anim', {
		run_right: { frames: [1, 2, 3], rate: 1/10},
		run_left: { frames: [17, 16, 15], rate: 1/10 },
		stand_right: { frames: [0], rate: 1/5 },
		stand_left: { frames: [14], rate: 1/5 },
		jump_right: { frames: [4], rate: 1/5 },
		jump_left: { frames: [18], rate: 1/5 },
		dead_right: { frames: [12], rate: 1/5 },
		dead_left: { frames: [26], rate: 1/5 }
	});
	
	//------------PRINCESS
	//-----------------------------------------------------
	//-----------------------------------------------------
	Q.Sprite.extend("Peach", {
	  
	  init: function(p) {
		this._super( {
			asset: "princess.png",
			x: 4500,
			y: 500
		});
		this.add('2d');
		this.on("bump.left, bump.right, bump.top", this, "win");
	  },
	  win: function(collision){
		if(collision.obj.isA("Mario")){
			collision.obj.del('platformerControls');
			levelwin = true;
			Q.stageScene("endGame", 1, {label: "You win this time..."});
		}
	  }
	  
	});
	
	//------------DEFAULT ENEMY
	//-----------------------------------------------------
	//-----------------------------------------------------
	Q.component('defaultEnemy', {
		
		added: function() {
			this.entity.on("bump.left, bump.right", this.entity, "kill");
			this.entity.on("bump.top", this.entity, "stomp");
		},
		
		extend: {
			stomp: function(collision) {
				if(collision.obj.isA("Mario")) {
					this.play("die", 1);
					this.p.vx=0;
					this.p.vy=0;
					this.off("bump.bottom");
					var self = this;
					setTimeout(function(){self.destroy()}, 800);
					collision.obj.p.vy = -500; // make the player jump
				}
			},
			
			kill: function(collision) {
				if(collision.obj.isA("Mario")) {
					collision.obj.death();
				}
			}
		}
	});
	
	//------------BLOOPA
	//-----------------------------------------------------
	//-----------------------------------------------------
	Q.Sprite.extend("Bloopa",{
		init: function(p) {
			// Listen for hit event and call the collision method
			this._super(p, {
				sprite: 'bloopa anim',
				sheet: "bloopa",
				x: 350,
				y: 500,
				vx: 75,
				vy: -300,
				gravity: 0.4
			});
			this.add('2d, animation, aiBounce, defaultEnemy');
			this.on("bump.bottom", this, "jump");
		},
		
		jump: function(collision) {
			this.kill(collision);
			this.p.vy = -300;
			this.play("jump");
			var self = this;
		},

		step: function(dt) {
		// Tell the stage to run collisions on this sprite
			if(this.p.y > 600){
				this.destroy();
			}
		}
	});
	
	Q.animations('bloopa anim', {
		walk: { frames: [0], rate: 1},
		jump: { frames: [1], next: "walk", rate: 1/8},
		die: { frames: [2], rate: 1}
	});

	
	//------------GOOMBA
	//-----------------------------------------------------
	//-----------------------------------------------------
	Q.Sprite.extend("Goomba",{
		init: function(p) {
			// Listen for hit event and call the collision method
			this._super(p, {
				sprite: 'goomba anim',
				sheet: "goomba",
				vx: 150,
				x: 250,
				y: 500
			});
			this.add('2d, animation, aiBounce, defaultEnemy');
			this.on("bump.bottom", this, "kill");
		},

		step: function(dt) {
		// Tell the stage to run collisions on this sprite
			this.play("walk");
			if(this.p.y > 600){
				this.destroy();
			}
		}
	});
	
	Q.animations('goomba anim', {
		walk: { frames: [0, 1], rate: 1/4},
		die: { frames: [2/*, 3*/], rate: 1/1}
	});
		
	//------------COIN
	//-----------------------------------------------------
	//-----------------------------------------------------
	Q.Sprite.extend("Coin",{
		init: function(p) {
			// Listen for hit event and call the collision method
			this._super(p, {
				sprite: 'coin anim',
				sheet: 'coin',
				catched: false,
				sensor: true
			});
			this.add('animation, tween');
			this.on("hit", this, "getCoin");
		},
		
		getCoin: function(collision) {
			if(collision.obj.isA("Mario") && !this.p.catched) {
				Q.audio.stop('coin.mp3');
				Q.audio.play('coin.mp3');
				this.animate({x: this.p.x, y: this.p.y-100, opacity: 0}, 1, Q.Easing.Quadratic.Out);
				var self = this;
				setTimeout(function(){self.destroy()}, 1200);
				Q.state.inc("coins", 1);
				this.p.catched = true;
			}
		},

		step: function(dt) {
		// Tell the stage to run collisions on this sprite
		//this.stage.collide(this);
			this.play("shining");
		}
	});
	
	Q.animations('coin anim', {
		shining: { frames: [0, 1, 2], rate: 1/5}
	});
	
	

	Q.loadTMX("level1.tmx, sprites.json, level2.tmx, wynot.tmx", function() {
		Q.stageScene("mainTitle");
	});
	
	Q.scene('endGame',function(stage) {
		var box = stage.insert(new Q.UI.Container({
			x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
		}));

		if(levelwin){	
			var button = box.insert(new Q.UI.Button({ x: 0, y: 0, fill: "#CCCCCC", label: "Next Level" })); 
			button.on("click",function() {
				if(currentLevel<=2)	
					currentLevel++;
				levelwin = false;
				Q.clearStages();
				Q.stageScene('level'+currentLevel);
				Q.stageScene('HUD', 1);
			});
		}else{ //Mario dies
			if(!lost){ //lives >= 0
				var button = box.insert(new Q.UI.Button({ x: 0, y: 0, fill: "#CCCCCC", label: "Play Again" }));
				button.on("click",function() {
					console.log(currentLevel);
					Q.clearStages();
					levelwin = false;
					Q.state.set({coins: 0});
					Q.stageScene('level'+currentLevel);
					Q.stageScene('HUD', 1);
				});
			}
		}
		var button2 = box.insert(new Q.UI.Button({ x: 0, y: 60, fill: "#CCCCCC",
											   label: "Main menu" }));  
												
		var label = box.insert(new Q.UI.Text({cx:button2.width/2, y: -10 - button2.p.h, 
											label: stage.options.label }));
		button2.on("click",function() {
			Q.clearStages();
			Q.state.set({coins: 0, lives: 3});
			Q.stageScene('mainTitle');
			
		});
		box.fit(20);
	});
	
	Q.scene('HUD',function(stage) {
		var label = stage.insert(new Q.UI.Text({x:150, y: 20, label: "Lives: "+Q.state.get("lives")+"	Coins: "+Q.state.get("coins")}));
		console.log(Q.state.get("coins"));
	});

	Q.scene('mainTitle', function(stage) {
		inMenu=true;
		var box = stage.insert(new Q.UI.Container({
			cx: Q.height/2, cy: Q.height/2,  fill: "rgba(0,0,0,1)"
		}));
		
		var button = box.insert(new Q.UI.Button({ x: Q.width/2, y: Q.height/2, fill: "#CCCCCC", asset: "mainTitle.png" })); 
		
		button.on("click", init);
		document.addEventListener("keyup", listener);
		document.body.addEventListener("touchstart", touch);
		
	});
	
	var touch=function(){
		if(inMenu){
			init();
			inMenu=false;
		}
	}
	
	var listener = function (evt) {
		if(evt.which==13) init();
	};
	
	function init(){
		
		Q.clearStages();
		document.removeEventListener("keyup", listener);
		currentLevel = 1;
		lost = false;
		Q.state.set({coins: 0, lives: 3});
		Q.stageScene('level1');
		Q.stageScene('HUD', 1);
	}

	// ## Level1 scene
		// Create a new scene called level 1
	Q.scene('level1', function(stage) {
		Q.stageTMX("wynot.tmx", stage);
		var mario = stage.insert(new Q.Mario());
		stage.insert(new Q.Bloopa());
		setInterval(function(){stage.insert(new Q.Bloopa());},4000);
		var peach = stage.insert(new Q.Peach());
		var coin = stage.insert(new Q.Coin({x:300, y:400}));
		var coin2 = stage.insert(new Q.Coin({x:350, y:400}));
		var coin2 = stage.insert(new Q.Coin({x:450, y:400}));
		var coin2 = stage.insert(new Q.Coin({x:650, y:400}));
		var coin2 = stage.insert(new Q.Coin({x:700, y:400}));
		var coin2 = stage.insert(new Q.Coin({x:1200, y:400}));
		var coin2 = stage.insert(new Q.Coin({x:1250, y:400}));
		stage.add("viewport").follow(mario, {x:true, y:false});
	});
	// ## Level2 scene
		// Create a new scene called level 2
	Q.scene('level2', function(stage) {
		Q.stageTMX("level2.tmx", stage);
		var mario = stage.insert(new Q.Mario());
		stage.insert(new Q.Bloopa());
		setInterval(function(){stage.insert(new Q.Bloopa());},4000);
		setInterval(function(){stage.insert(new Q.Bloopa({x:3094,y:500}));},3000);
		setInterval(function(){stage.insert(new Q.Goomba({y:400,x:1300}));},3000);
		var peach = stage.insert(new Q.Peach());
		var coin = stage.insert(new Q.Coin({x:300, y:400}));
		var coin2 = stage.insert(new Q.Coin({x:350, y:400}));
		var coin2 = stage.insert(new Q.Coin({x:450, y:400}));
		var coin2 = stage.insert(new Q.Coin({x:650, y:400}));
		var coin2 = stage.insert(new Q.Coin({x:700, y:400}));
		var coin2 = stage.insert(new Q.Coin({x:1200, y:400}));
		var coin2 = stage.insert(new Q.Coin({x:1250, y:400}));
		
		stage.add("viewport").follow(mario, {x:true, y:false});
	});
};

