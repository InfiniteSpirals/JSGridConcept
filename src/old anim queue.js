			//test out some subgrid allocations
			// masterGrid.injectGrid({
			// 	rows:4,
			// 	cols:4,
			// 	initMethods : ['setBackground','setRollover'],
			// 	background: 'url(images/pink_lotus_flower_wallpaper.jpg)',
			// 	chainMethods: ['ripple']
			// },4,0);
			masterGrid.injectGrid({
				rows:1,
				cols:8,
				initMethods : ['setBackground'],
				background: 'url("images/coastline-of-maui.jpg")',
				scrollAnim:false,
				chainMethods: []
			},0,5);
			var masterQueue = $({});
			masterQueue.queue('animation',function(next){
				masterGrid.setOption('text','hello!||and|welcome').
					setOption('textystart',1).
					invoke('setNextBlockText').
					invoke('ripple').
					invoke('setAfter').
					sbQueue(next,options.sbpause);
			});
			masterQueue.queue('animation', function(next){
				masterGrid.setOption('background','url(images/psychedelic-violet.jpg)').
					setOption('text','Meet|Your|New|3D Grid|System').
					setOption('textystart',0).
					invoke('setNextBackground').
					invoke('setNextBlockText').
					invoke('ripple','x').
					invoke('setAfter').
					sbQueue(next,options.sbpause);
			});
			masterQueue.queue('animation', function(next){
				masterGrid.setOption('text','some|more|stuff|in here').
					setOption('textystart',1).
					invoke('setNextBackground').
					invoke('setNextBlockText').
					invoke('ripple').
					invoke('setAfter').
					sbQueue(next,options.sbpause);
			});
			masterQueue.queue('animation', function(next){
				masterGrid.setOption('background','url(images/Fractal_Broccoli.jpg)').
					setOption('text','fancy|some|fractal|broc?').
					setOption('textystart',0).
					invoke('setNextBackground').
					invoke('setNextBlockText').
					invoke('ripple','x').
					invoke('setAfter').
					sbQueue(next,options.sbpause);
			});
			masterQueue.queue('animation', function(next){
				masterGrid.setOption('background','url(images/Fractal_Broccoli.jpg)').
					setOption('text','fancy|some|fractal|brostep').
					setOption('textystart',0).
					invoke('setNextBackground').
					invoke('setNextBlockText').
					invoke('ripple','x').
					invoke('setAfter').
					sbQueue(next,options.sbpause);
			});
			masterQueue.queue('animation', function(next){
				masterGrid.setOption('background','url(images/psychedelic-violet.jpg)').
					setOption('text','some|more|stuff|in here').
					setOption('textystart',1).
					invoke('setNextBackground').
					invoke('setNextBlockText').
					invoke('ripple').
					invoke('setAfter').
					sbQueue(next,options.sbpause);
			});
			masterQueue.queue('animation', function(next){
				masterGrid.getSubgrid(0).invoke('scrollMessage',1,'hello there!!').
					sbQueue(next,options.sbpause);
			});
			masterQueue.queue('animation',function(next){
				masterGrid.setOption('text','back|to the|maui|coast..').
					setOption('background','url("images/coastline-of-maui.jpg")').
					setOption('textystart',1).
					invoke('setNextBackground').
					invoke('setNextBlockText').
					invoke('ripple').
					invoke('setAfter').
					invoke('setRollover').
					sbQueue(next,options.sbpause);
			});
			setTimeout(function(){
				masterQueue.dequeue('animation');
			},options.sbpause);
			setTimeout(function(){
				//console.log('in here...');
				masterGrid.getSubgrid(0).invoke('scrollMessage',1,'hello there!! why not read this long scroller!? It may contain some gems of wisdom, or perhaps, declarations of love for rachee roo !! :)');
			},500);