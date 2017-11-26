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
			"nigga.png", "nigga.json","white.png","white.json","pardillos.png","pardillos.json",
			"trump.png","water.png","broken.png","sobre2.png","sobre2.json","pixar.png","pizarra.png","bryan.png","wtf.png", "martina.png",
			"unicornio.png","unicornio.json","sobre.png","sobre.json","xen.png", "puerta.png",
			"tony.png","silla.png","results.png","miri.png","dave.png", "barricada.png",
				"bloopa.json","goomba.png","goomba.json", "princess.png", "intro1.png", "intro2.png",
					"coin.png", "coin.json","wynot.mp3", "music_main.mp3", "coin.mp3", "music_die.mp3"], function(){
		Q.compileSheets("mario_small.png","mario_small.json");
		Q.compileSheets("bloopa.png","bloopa.json");
		Q.compileSheets("goomba.png","goomba.json");
		Q.compileSheets("coin.png", "coin.json");
		Q.compileSheets("sobre.png", "sobre.json");
		Q.compileSheets("sobre2.png", "sobre2.json");
		Q.compileSheets("nigga.png", "nigga.json");
		Q.compileSheets("unicornio.png", "unicornio.json");
		Q.compileSheets("pardillos.png", "pardillos.json");
		Q.compileSheets("white.png", "white.json");
		Q.audio.play("wynot.mp3",{ loop: true });
	});
	
	//------------Unicornio
	//-----------------------------------------------------
	//-----------------------------------------------------
	Q.Sprite.extend("Unicornio", {
	  
	  init: function(p) {
		this._super(p, {
			sprite: "unicornio anim",
			sheet: "unicornioRun",
			x: 150,
			y: 230,
			jumpSpeed: -700,
			gravity: 1,
			dead: false
		});
		this.add('2d, platformerControls, animation');
	  },
	  
	  step: function(dt) {
		if(this.p.y > 600 && !this.p.dead){
			this.death();
		}
		if(!this.p.dead){
			if(!this.p.vy)
				this.play("run");
			else
				this.play("jump");
		}
	  },
	  
	  death: function(){
		if(!levelwin && !this.p.dead){
			Q.audio.stop();
			Q.audio.play("music_die.mp3");
			this.del('platformerControls');
			this.p.vx = 0;
			this.p.vy=-300;
			this.play("die");
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
		}
	  },
	  
	});
	Q.animations('unicornio anim', {
		run: { frames: [0, 1], rate: 1/5},
		jump:{frames:[2], rate:1/5},
		die: { frames: [3], rate: 1/5 }
	});
	
	//------------Puerta
	//-----------------------------------------------------
	//-----------------------------------------------------
	Q.Sprite.extend("Puerta", {
	  
	  init: function(p) {
		this._super( p,{
			asset: "puerta.png",
			x: 14000,
			y: 300
		});
		this.add('2d');
		this.on("bump.left, bump.right, bump.top", this, "win");
	  },
	  win: function(collision){
		if(collision.obj.isA("Unicornio")){
			collision.obj.del('platformerControls');
			collision.obj.p.vx=0;
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
			this.entity.on("bump.right, bump.top", this.entity, "kill");
		},
		
		extend: {
			stomp: function(collision) {
				if(collision.obj.isA("Unicornio")) {
					//this.play("die", 1);
					this.p.vx=0;
					this.p.vy=0;
					this.off("bump.bottom");
					var self = this;
					setTimeout(function(){self.destroy()}, 800);
					collision.obj.p.vy = -500; // make the player jump
				}
			},
			
			kill: function(collision) {
				if(collision.obj.isA("Unicornio")) {
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

	
	//------------Negro
	//-----------------------------------------------------
	//-----------------------------------------------------
	Q.Sprite.extend("Negro",{
		init: function(p) {
			// Listen for hit event and call the collision method
			this._super(p, {
				sprite: 'nigga anim',
				sheet: "niggaWalk",
				vx: -300,
				x: 250,
				y: 500
			});
			this.add('2d, animation, aiBounce, defaultEnemy');
			this.on("bump.left", this, "kill");
		},

		step: function(dt) {
		// Tell the stage to run collisions on this sprite
			this.play("walk");
			if(this.p.y > 600){
				this.destroy();
			}
		}
	});
	
	Q.animations('nigga anim', {
		walk: { frames: [0, 1], rate: 1/4}
	});
	
	
	//------------Blanco
	//-----------------------------------------------------
	//-----------------------------------------------------
	Q.Sprite.extend("Blanco",{
		init: function(p) {
			// Listen for hit event and call the collision method
			this._super(p, {
				sprite: 'white anim',
				sheet: "whiteWalk",
				vx: -250,
				x: 250,
				y: 500
			});
			this.add('2d, animation, aiBounce, defaultEnemy');
			this.on("bump.left", this, "kill");
		},

		step: function(dt) {
		// Tell the stage to run collisions on this sprite
			this.play("walk");
			if(this.p.y > 600){
				this.destroy();
			}
		}
	});
	
	Q.animations('white anim', {
		walk: { frames: [0, 1], rate: 1/4}
	});
	
	//------------Pardillos
	//-----------------------------------------------------
	//-----------------------------------------------------
	Q.Sprite.extend("Pardillos",{
		init: function(p) {
			// Listen for hit event and call the collision method
			this._super(p, {
				sprite: 'pardillos anim',
				sheet: "pardillosStay",
				vx: 0,
				x: 250,
				y: 500
			});
			this.add('2d, animation, aiBounce, defaultEnemy');
			this.on("bump.left", this, "kill");
		},

		step: function(dt) {
		// Tell the stage to run collisions on this sprite
			this.play("stay");
			if(this.p.y > 600){
				this.destroy();
			}
		}
	});
	
	Q.animations('pardillos anim', {
		stay: { frames: [0, 1, 2, 3], rate: 1/4}
	});
	
	
	//------------SOBRE
	//-----------------------------------------------------
	//-----------------------------------------------------
	Q.Sprite.extend("Sobre",{
		init: function(p) {
			// Listen for hit event and call the collision method
			this._super(p, {
				sprite: 'sobre anim',
				sheet: "sobreFly",
				vx: -450,
				x: 250,
				y: 500,
				gravity:0
			});
			this.add('2d, animation, defaultEnemy');
			this.on("bump.left, bump.bottom", this, "bounce");
		},

		step: function(dt) {
		// Tell the stage to run collisions on this sprite
			this.play("fly");
			if(this.p.y > 600){
				this.destroy();
			}
		},
		
		bounce: function(collision) {
			this.kill(collision);
			this.destroy();
		}
	});
	
	Q.animations('sobre anim', {
		fly: { frames: [0, 1, 2], rate: 1/4}
	});
	
	
	//------------SOBRE2
	//-----------------------------------------------------
	//-----------------------------------------------------
	Q.Sprite.extend("Sobre2",{
		init: function(p) {
			// Listen for hit event and call the collision method
			this._super(p, {
				sprite: 'sobre2 anim',
				sheet: "sobre2Fly",
				vx: -450,
				x: 250,
				y: 500,
				gravity:0
			});
			this.add('2d, animation, defaultEnemy');
			this.on("bump.left, bump.bottom", this, "bounce");
		},

		step: function(dt) {
		// Tell the stage to run collisions on this sprite
			this.play("fly");
			if(this.p.y > 600){
				this.destroy();
			}
		},
		
		bounce: function(collision) {
			this.kill(collision);
			this.destroy();
		}
	});
	
	Q.animations('sobre2 anim', {
		fly: { frames: [0, 1, 2], rate: 1/4}
	});
	
	//------------Xen
	//-----------------------------------------------------
	//-----------------------------------------------------
	Q.Sprite.extend("Xen",{
		init: function(p) {
			// Listen for hit event and call the collision method
			this._super(p,{
				asset: "xen.png"
			});
			this.add('2d, animation, aiBounce, defaultEnemy');
			this.on("bump.left", this, "kill");
		},
	});
	
	Q.animations('xen anim', {
		stay: { frames: [0], rate: 1/5}
	});
	
	//------------Tony
	//-----------------------------------------------------
	//-----------------------------------------------------
	Q.Sprite.extend("Tony",{
		init: function(p) {
			// Listen for hit event and call the collision method
			this._super( p,{
				asset:"tony.png"
			});
			this.add('2d, animation, aiBounce, defaultEnemy');
			this.on("bump.left", this, "kill");
		},
	});
	
	//------------Silla
	//-----------------------------------------------------
	//-----------------------------------------------------
	Q.Sprite.extend("Silla",{
		init: function(p) {
			// Listen for hit event and call the collision method
			this._super( p,{
				asset:"silla.png"
			});
			this.add('2d, animation, aiBounce, defaultEnemy');
			this.on("bump.left", this, "kill");
		},
	});
	
	//------------Results
	//-----------------------------------------------------
	//-----------------------------------------------------
	Q.Sprite.extend("Results",{
		init: function(p) {
			// Listen for hit event and call the collision method
			this._super( p,{
				asset:"results.png"
			});
			this.add('2d, animation, aiBounce, defaultEnemy');
			this.on("bump.left", this, "kill");
		},
	});
	
	//------------Miri
	//-----------------------------------------------------
	//-----------------------------------------------------
	Q.Sprite.extend("Miri",{
		init: function(p) {
			// Listen for hit event and call the collision method
			this._super(p, {
				asset:"miri.png"
			});
			this.add('2d, animation, aiBounce, defaultEnemy');
			this.on("bump.left", this, "kill");
		},
	});
	
	//------------Dave
	//-----------------------------------------------------
	//-----------------------------------------------------
	Q.Sprite.extend("Dave",{
		init: function(p) {
			// Listen for hit event and call the collision method
			this._super(p, {
				asset:"dave.png"
			});
			this.add('2d, animation, aiBounce, defaultEnemy');
			this.on("bump.left", this, "kill");
		},
	});
	
	//------------Barricada
	//-----------------------------------------------------
	//-----------------------------------------------------
	Q.Sprite.extend("Barricada",{
		init: function(p) {
			// Listen for hit event and call the collision method
			this._super(p, {
				asset:"barricada.png"
			});
			this.add('2d, animation, aiBounce, defaultEnemy');
			this.on("bump.left", this, "kill");
		},
	});
	
	//------------TRUMP
	//-----------------------------------------------------
	//-----------------------------------------------------
	Q.Sprite.extend("Trump",{
		init: function(p) {
			// Listen for hit event and call the collision method
			this._super(p,{
				asset: "trump.png"
			});
			this.add('2d, animation, aiBounce, defaultEnemy');
			this.on("bump.left", this, "kill");
		},
	});
	
	
	//------------Water
	//-----------------------------------------------------
	//-----------------------------------------------------
	Q.Sprite.extend("Water",{
		init: function(p) {
			// Listen for hit event and call the collision method
			this._super(p,{
				asset: "water.png"
			});
			this.add('2d, animation, aiBounce, defaultEnemy');
			this.on("bump.left", this, "kill");
		},
	});
	
	
	//------------BROKEN
	//-----------------------------------------------------
	//-----------------------------------------------------
	Q.Sprite.extend("Broken",{
		init: function(p) {
			// Listen for hit event and call the collision method
			this._super(p,{
				asset: "broken.png"
			});
			this.add('2d, animation, aiBounce, defaultEnemy');
			this.on("bump.left", this, "kill");
		},
	});
	
	
	//------------PIXAR
	//-----------------------------------------------------
	//-----------------------------------------------------
	Q.Sprite.extend("Pixar",{
		init: function(p) {
			// Listen for hit event and call the collision method
			this._super(p,{
				asset: "pixar.png"
			});
			this.add('2d, animation, aiBounce, defaultEnemy');
			this.on("bump.left", this, "kill");
		},
	});
	
	
	//------------PIZARRA
	//-----------------------------------------------------
	//-----------------------------------------------------
	Q.Sprite.extend("Pizarra",{
		init: function(p) {
			// Listen for hit event and call the collision method
			this._super(p,{
				asset: "pizarra.png"
			});
			this.add('2d, animation, aiBounce, defaultEnemy');
			this.on("bump.left", this, "kill");
		},
	});
	
	
	//------------BRYAN
	//-----------------------------------------------------
	//-----------------------------------------------------
	Q.Sprite.extend("Bryan",{
		init: function(p) {
			// Listen for hit event and call the collision method
			this._super(p,{
				asset: "bryan.png"
			});
			this.add('2d, animation, aiBounce, defaultEnemy');
			this.on("bump.left", this, "kill");
		},
	});
	
	
	//------------WTF
	//-----------------------------------------------------
	//-----------------------------------------------------
	Q.Sprite.extend("Wtf",{
		init: function(p) {
			// Listen for hit event and call the collision method
			this._super(p,{
				asset: "wtf.png"
			});
			this.add('2d, animation, aiBounce, defaultEnemy');
			this.on("bump.left", this, "kill");
		},
	});
	
	
	//------------Martina
	//-----------------------------------------------------
	//-----------------------------------------------------
	Q.Sprite.extend("Martina",{
		init: function(p) {
			// Listen for hit event and call the collision method
			this._super(p,{
				asset: "martina.png"
			});
			this.add('2d, animation, aiBounce, defaultEnemy');
			this.on("bump.left", this, "kill");
		},
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
			if(collision.obj.isA("Unicornio") && !this.p.catched) {
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
	
	

	Q.loadTMX("level1.tmx, sprites.json, level2.tmx, wynot.tmx, wynot2.tmx", function() {
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
		}else{ //Unicornio dies
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
			cx: Q.height/2, cy: Q.height/2,  fill: "rgba(255,255,255,1)"
		}));
		var button = box.insert(new Q.UI.Button({ x: Q.width/2, y: Q.height/2, fill: "#CCCCCC", asset: "mainTitle.png" })); 
		button.on("click", init0);
		document.addEventListener("keyup", listener);
		document.body.addEventListener("touchstart", touch);
		
	});
	
	Q.scene('intro1', function(stage) {
		inMenu=true;
		var box = stage.insert(new Q.UI.Container({
			cx: Q.height/2, cy: Q.height/2,  fill: "rgba(255,255,255,1)"
		}));
		var button = box.insert(new Q.UI.Button({ x: Q.width/2, y: Q.height/2, fill: "#CCCCCC", asset: "intro1.png" })); 
		button.on("click", init1);
		document.addEventListener("keyup", listener);
		document.body.addEventListener("touchstart", touch);
		
	});
	
	Q.scene('intro2', function(stage) {
		inMenu=true;
		var box = stage.insert(new Q.UI.Container({
			cx: Q.height/2, cy: Q.height/2,  fill: "rgba(255,255,255,1)"
		}));
		var button = box.insert(new Q.UI.Button({ x: Q.width/2, y: Q.height/2, fill: "#CCCCCC", asset: "intro2.png" })); 
		button.on("click", init2);
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
	
	
	function init0(){
		
		Q.clearStages();
		document.removeEventListener("keyup", listener);
		Q.stageScene('intro1');
	}
	
	function init1(){
		
		Q.clearStages();
		document.removeEventListener("keyup", listener);
		Q.stageScene('intro2');
	}
	
	function init2(){
		
		Q.clearStages();
		document.removeEventListener("keyup", listener);
		currentLevel = 2;//cambiar
		lost = false;
		Q.state.set({coins: 0, lives: 3});
		Q.stageScene('level2');//cambiar
		Q.stageScene('HUD', 1);
	}

	// ## Level1 scene
		// Create a new scene called level 1
	Q.scene('level1', function(stage) {
		Q.stageTMX("wynot.tmx", stage);
		var unicornio = stage.insert(new Q.Unicornio());
		stage.insert(new Q.Silla({y:400,x:2500}));
		stage.insert(new Q.Miri({y:400,x:3500}));
		stage.insert(new Q.Tony({y:400,x:4500}));
		stage.insert(new Q.Xen({y:400,x:5200}));
		stage.insert(new Q.Dave({y:400,x:6500}));
		stage.insert(new Q.Barricada({y:400,x:7500}));
		stage.insert(new Q.Silla({y:400,x:8500}));
		stage.insert(new Q.Results({y:400,x:9500}));
		stage.insert(new Q.Negro({y:400,x:10500}));
		stage.insert(new Q.Blanco({y:400,x:11500}));
		stage.insert(new Q.Negro({y:400,x:12500}));
		stage.insert(new Q.Silla({y:400,x:13500}));
		var peach = stage.insert(new Q.Puerta());
		stage.add("viewport").follow(unicornio, {x:true, y:false});
	});
	// ## Level2 scene
		// Create a new scene called level 2
	Q.scene('level2', function(stage) {
		Q.stageTMX("wynot2.tmx", stage);
		var unicornio = stage.insert(new Q.Unicornio());
		//setInterval(function(){stage.insert(new Q.Bloopa());},4000);
		
		stage.insert(new Q.Trump({y:400,x:1500}));
		stage.insert(new Q.Water({y:400,x:2300}));
		stage.insert(new Q.Water({y:400,x:3000}));
		stage.insert(new Q.Water({y:400,x:3050}));
		stage.insert(new Q.Broken({y:400,x:3700}));
		setTimeout(function(){stage.insert(new Q.Sobre2({y:300,x:4800}));},7000);
		setTimeout(function(){stage.insert(new Q.Sobre2({y:500,x:5300}));},8000);
		stage.insert(new Q.Pixar({y:400,x:5800}));
		//stage.insert(new Q.Sobre2({y:400,x:9500}));
		stage.insert(new Q.Pizarra({y:400,x:6900}));
		stage.insert(new Q.Martina({y:400,x:7600}));
		stage.insert(new Q.Bryan({y:400,x:8400}));
		//stage.insert(new Q.Negro({y:400,x:13500}));
		//stage.insert(new Q.Blanco({y:400,x:14500}));
		stage.insert(new Q.Pardillos({y:400,x:15500}));
		stage.insert(new Q.Wtf({y:400,x:16500}));
		stage.insert(new Q.Sobre({y:400,x:17200}));
		stage.insert(new Q.Sobre2({y:400,x:18500}));
		stage.insert(new Q.Sobre({y:400,x:19300}));
		stage.insert(new Q.Sobre2({y:400,x:20500}));
		stage.insert(new Q.Sobre2({y:400,x:21500}));
		stage.insert(new Q.Silla({y:400,x:22500}));
		stage.insert(new Q.Silla({y:400,x:22500}));
		stage.insert(new Q.Puerta({y:400,x:19500}));
		
		stage.add("viewport").follow(unicornio, {x:true, y:false});
	});
};

