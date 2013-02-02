/*! Jsgridconcept - v0.0.1 - 2013-02-02
* https://github.com/InfiniteSpirals/JSGridConcept
* Copyright (c) 2013 InfiniteSpirals; Licensed MIT */

(function($) {
	//not in use atm. for future iterations with multiple cell adapters.
	//var animations = {},celltypes = {};

	//Grid Constructor.	
	var Grid = function(elem$,options){
		//define collection of elements and array of cells.
		var cells = []; 
		var z=0;
		//Grid Queue Object
		var gridQueue = $({});
		//Track grid animation.
		var queueInProgress = false;
		//calculate offset.
		options.cellOffset = options.cellDiam + options.cellMargin;	
		//populate array with cells
		for(var x=0;x < options.rows;x++){
			for(var y=0;y < options.cols;y++){
				var cellOptions = {
					backgroundX : y > 0 ? options.cellOffset*y : y, 
					backgroundY : x > 0 ? options.cellOffset*x : x,
					background : options.background
				};
				cells.push(new Cell(cellOptions,$(elem$[z])));
				z++;
			}
		}
		var sbQueueCallback;
		var sbQueue = this.sbQueue = function(callback){
			if(callback){
				sbQueueCallback = callback;
			}
			if(!testAnimation()){
				setTimeout(function(){
					sbQueueCallback.call();
				},options.sbpause);
			}else{
				setTimeout(sbQueue,250);
			}
		}
		//Grid specific methods
		var methods = {
			setAfter : function() {
				if(!testAnimation()){
					methods['setBackground']();
					if(options.rollover) methods['setRollover']();
				}else{
					setTimeout(methods['setAfter'],250);
				}
			},
			setBackground : function(){
				for(var x=0;x<cells.length;x++){
					cells[x].setBackground();
				}
			},
			setRollover : function(){
				options.rollover = true;
				for(var x=0;x<cells.length;x++){
					cells[x].rollover();
				}
			},
			setBlockText : function(bnext,xstart,ystart){
				//at somepoint will need to update this method to calculate
				//break points in text/grid and provide some sort of handling
				//for when the text exceeds the limits of the grid.
				var xstart = xstart || options.textxstart, ystart = ystart || options.textystart, bnext = bnext || false;
				//split text into 'rows' by CR.
				var texta = options.text.split('|');
				$.each(texta,function(i, strText){
					//calculate starting cell from x+y positions
					var firstcell = ((options.cols * ystart) + (options.cols * i)) + xstart;
					console.log('debug - i=' + i + ' firstcell=' + firstcell + ' strText=' + strText);
					//now loop through each character in the string
					var letters = strText.split('');
					$.each(letters,function(j, letter){
						console.log('j=' + j + ' letter=' + letter + ' firstcell+j=' + (firstcell+j));
						if(!bnext){
							cells[(firstcell+j)].setHTML('<span>' + letter + '</span>');
						}else{
							cells[(firstcell+j)].setNextHTML('<span>' + letter + '</span>');
						}
					});
				});
			},
			setNextBlockText : function(){
				$.each(cells,function(i, cell){
					cell.setNextHTML('');
				});
				methods['setBlockText'](true);
			},	
			ripple : function(rtype){
				//unbind all rollovers... else we can get nasty messes.
				$.each(cells,function(i,cell){
					cell.unbind();
				});
				var chainsFired = [], aCells = [], dur = 250;
				switch(rtype){
					case 'x':
						//determine cells for each column.
						var aCells = [];
						for(var y=0;y<options.cols;y++){
							//cells for this column.
							var col = [];
							for(var x=0;x<options.rows;x++){
								var pos = x>0 ? (x*options.cols)+y : x+y;
								col.push(cells[pos]);
							}
							aCells.push(col);
						}
						break;
					case 'y':
						//determine cells for each row.
						var rows = [];
						for(var x=0;x<options.rows;x++){
							//cells for this row.
							var row = [];
							for(var y=0;y<options.cols;y++){
								var pos = (x+y)>0 ? (x*options.cols+y) : 0;
								row.push(cells[pos]);
							}
							aCells.push(row);
						}
						break;
					default: 
						aCells = cells;
						dur = 25;
				}

				//do the rippling!
				$.each(aCells,function(i, cell){
					var qq = gridQueue.queue('ripple',function(next){
						setTimeout(function(){
							var handleRipple = function(thecell){
								if(thecell instanceof Cell){
									thecell.nextState();
								}else{
									if($.inArray(thecell,chainsFired)==-1 && $.inArray('ripple',subgrids[thecell].getOption('chainMethods'))!=-1){
										subgrids[thecell].invoke('ripple');
										chainsFired.push(thecell);
									}								
								}
							};
							if(Object.prototype.toString.call(cell) === '[object Array]'){
								$.each(cell,function(i, thiscell){
									handleRipple(thiscell);
								});
							}else{
								handleRipple(cell);
							}
							if(gridQueue.queue('ripple').length == 0) {
								queueInProgress=false;
							}
							next();
						},dur);
					});
				});
				queueInProgress = true;
				gridQueue.dequeue('ripple');
			},
			setNextBackground : function(){
				$.each(cells,function(i, cell){
					if(cell instanceof Cell){
						cell.setOption('background',options.background).setNextBackground();
					}
				});
			}
		};	
		
		//this is to test if all animations are complete for this grid.
		var isAnimating = false;
		var monitorAnimation = function(){
			if(!queueInProgress){
				var test = false;
				for(var x=0;x<cells.length;x++){
					if(cells[x].getCellTransitionStatus()){
						test = true;
					}
				}
				if(test){
					isAnimating = true;
					setTimeout(monitorAnimation,25);
				}else{
					isAnimating = false;
				}
			}else{
				isAnimating = true;
				setTimeout(monitorAnimation,25);
			}
		};

		var testAnimation =  this.testAnimation = function(){
			monitorAnimation();
			return isAnimating;				
		}

		var initgrid = function(){
			for(var x=0;x<options.initMethods.length;x++){
				if(methods[options.initMethods[x]]){
					methods[options.initMethods[x]].call(this);
				}
			}
		};
		var subgrids = [];
		this.injectGrid = function(sgoptions,xstart,ystart){
			//take defaults for this grid, extend with subgrid options.
			var sgoptions = $.extend({},options,sgoptions);
			//work out X/Y positions.
			//n.b will need to add some testing to check its within dimensions here
			var subGrid$ = [];
			for(var y=0;y<sgoptions.rows;y++){
				var firstcell = ((options.cols * ystart) + (options.cols * y)) + xstart;
				for(var x=0;x<sgoptions.cols;x++){
					var pos = firstcell+x;
					//assign jquery wrapped cell HTMLElement to subgrid elements array.
					subGrid$.push(elem$[pos]);
					//whilst we're in this loop, we have the affected position reference so we can
					//unbind any events bound to cell element in master grid.
					cells[pos].unbind();
					//... and add a reference to the subgrid into this grids cells array.
					cells[pos] = subgrids.length;
				}
			}
			//create the subgrid and push it into the subgrids array of this grid.
			subgrids.push(new Grid(subGrid$,sgoptions));
		};

		this.getSubgrid = function(id){
			//robustify??
			return subgrids[id];
		};

		this.invoke = function(method){
			if (methods[method]) {
				methods[method].apply(this,Array.prototype.slice.call(arguments,1));
			}
			//make chainable(?)
			return this;
		};
		//might make use of this in future for diff adapters etc.
		this.injectMethod = function(method,newmethod){
			methods[method] = newmethod;			
		};

		this.setOption = function(option,value){
			options[option] = value;
			//console.log(options[option]);
			//make chainable
			return this;
		};

		this.getOption = function(option){
			return options[option] || '';			
		};
		//carry out some default init behaviour..
		initgrid();
	};	

	//Cell Constructor
	var Cell = function(options,cell$){
		var nextClasses = ['show-left','show-right','show-front','show-back'];
		var nextFaces = ['left','right','front','back'];
		var baseFace = 'front';
		var binded = [];
		var x=0;

		//hmm - probs need to refactor these into a methods object
		//if/when we want to be able to specify custom cell types,
		//to allow them to be overwritten from custom methods sent to the master grid on init.

		this.setBackground = function(){
			//this this is redundant.
			//when this is converted to handle cell adapters
			//they will all need some sort of next state etc.
			cell$.css({ 
				backgroundImage: options.background,
				backgroundPositionX: -options.backgroundX,
				backgroundPositionY: -options.backgroundY
			});
			//this is the relevant stuffz.
			cell$.find('.face').css({
				backgroundImage: options.background,
				backgroundPositionX: -options.backgroundX,
				backgroundPositionY: -options.backgroundY
			});
		};
		this.setNextBackground = function(){
			for(var i=0;i<nextFaces.length;i++){
				if(i!=(x-1) && nextFaces[i]!=baseFace){
					cell$.find('.' + nextFaces[i]).css({
						backgroundImage: options.background
					});
				}
			}			
		};
		this.setHTML = function(strHTML){
			//just faces for now... 
			cell$.find('.face').html(strHTML);
		};
		this.setNextHTML = function(strHTML){
			for(var i=0;i<nextFaces.length;i++){
				if(i!=(x-1) && nextFaces[i]!=baseFace){
					cell$.find('.' + nextFaces[i]).html(strHTML);
				}
			}
		};
		this.setOption = function(option,value){
			options[option] = value;
			//make chainable
			return this;
		};

		this.getOption = function(option,value){
			return options[option] || '';
		};

		this.nextState = function(){
			if(!transitionInProgress){
				baseFace = '';
				transitionInProgress = true;
				cell$.find('.cube').removeClass().addClass(nextClasses[x]).addClass('cube');
				x<nextClasses.length ? x++ : x=0;
			}
		};

		this.rollover = function(){
			binded.push('mouseover');
			var ns = this.nextState;
			cell$.mouseover(function(){
				ns();
			});
		};

		this.unbind = function(){
			$.each(binded,function(i, eventType){
				cell$.unbind(eventType);
			});
			binded = [];
		};
		var transitionInProgress = false;
		var transitionCallbacks = ['webkitTransitionEnd','transitionend','oTransitionEnd'];
		//bind animation callback to cell
		$.each(transitionCallbacks,function(i, tcback){
			cell$.bind(tcback,function(){
				transitionInProgress = false;
			});
		});

		this.getCellTransitionStatus = function(){
			return transitionInProgress;
		};
	};


	// Collection method (MasterGrid).
	$.fn.JSGridConcept = function(options) {
		var defaults = {
			//Master grid defaults.
			rows: 6,
			cols: 8,
			cellDiam: 100,
			cellMargin: 4,
			sbpause: 1000,
			cellType: 'square',
			text: 'hello!|You|Lucky|People',
			textxstart: 1,
			textystart: 1,
			background: 'url(images/psychedelic-violet.jpg)',
			skin: '<div class="cell"><div class="cube"><div class="face front"></div><div class="face back"></div><div class="face right"></div><div class="face left"></div><div class="face top"></div><div class="face bottom"></div></div</div>', 
			initMethods: ['setBackground','setBlockText','setRollover']
		};
		//extend defaults with user defined options.
		var options = $.extend(defaults, options);
				
		return this.each(function(index) {
			//Generate master grid cells.
			for(var x=0;x < options.rows;x++){
				for(var y=0;y < options.cols;y++){
					$(this).append(options.skin);				
				}
			}
			//Create Grid object to represent MasterGrid.
			var masterGridCells = $(this).find('.cell');
			var masterGrid = new Grid(masterGridCells,options);

			//test out some subgrid allocations
			// masterGrid.injectGrid({
			// 	rows:4,
			// 	cols:4,
			// 	initMethods : ['setBackground','setRollover'],
			// 	background: 'url(images/pink_lotus_flower_wallpaper.jpg)',
			// 	chainMethods: ['ripple']
			// },4,0);
			var masterQueue = $({});
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
				masterGrid.setOption('background','url(images/maui-sunset.jpg)').
					setOption('text','some|more|stuff|in here').
					setOption('textystart',1).
					invoke('setNextBackground').
					invoke('setNextBlockText').
					invoke('ripple','y').
					invoke('setAfter').
					sbQueue(next,options.sbpause);
			});
			masterQueue.queue('animation', function(next){
				masterGrid.setOption('background','url(images/Fractal_Broccoli.jpg)').
					setOption('text','fancy|some|fractal|broc?').
					setOption('textystart',2).
					invoke('setNextBackground').
					invoke('setNextBlockText').
					invoke('ripple').
					invoke('setAfter').
					sbQueue(next,options.sbpause);
			});
			setTimeout(function(){
				masterQueue.dequeue('animation');
			},options.sbpause);

			//Next Steps.
			//1: Add 'ripple in progress' or similar. Done! - subgrids? 
			//2: Allow setting of background after ripple so that we dont have any faces still on previous BG. - DONE!!!
			//3: Text - and text moving x/y/z.
			//   (Text stuffs should be similar to nextBackgrounds etc.)
			
		});
	};
})(jQuery);

$(function(){
	$('#gridconcept').JSGridConcept({
		rows: 6,
		cols: 8,
		background: 'url("images/coastline-of-maui.jpg")'
	});
});