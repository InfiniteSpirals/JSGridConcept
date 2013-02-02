/*
 * JSGridConcept
 * https://github.com/InfiniteSpirals/JSGridConcept
 *
 * Copyright (c) 2013 InfiniteSpirals
 * Licensed under the MIT license.
 */

(function($) {
	var animations = {},celltypes = {};
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
		this.setBackground = function(){
			cell$.css({ 
				backgroundImage: options.background,
				backgroundPositionX: -options.backgroundX,
				backgroundPositionY: -options.backgroundY
			});
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

		this.setOption = function(option,value){
			options[option] = value;
			//make chainable
			return this;
		}

		this.getOption = function(option,value){
			return options[option] || '';
		}

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
		}
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
			cellType: 'square',
			background: 'url(images/psychedelic-violet.jpg)',
			skin: '<div class="cell"><div class="cube"><div class="face front"></div><div class="face back"></div><div class="face right"></div><div class="face left"></div><div class="face top"></div><div class="face bottom"></div></div</div>', 
			initMethods: ['setBackground']
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
			
			//setInterval(function(){masterGrid.invoke('ripple')},4000);

			//test out some subgrid allocations
			// masterGrid.injectGrid({
			// 	rows:4,
			// 	cols:4,
			// 	initMethods : ['setBackground','setRollover'],
			// 	background: 'url(images/pink_lotus_flower_wallpaper.jpg)',
			// 	chainMethods: ['ripple']
			// },4,0);
			setTimeout(function(){
				masterGrid.setOption('background','url(images/psychedelic-violet.jpg)').
					invoke('setNextBackground').
					invoke('ripple','x').
					invoke('setAfter');
			},4000);

			//Next Steps.
			//1: Add 'ripple in progress' or similar. Done! - subgrids? 
			//2: Allow setting of background after ripple so that we dont have any faces still on previous BG.
			//3: Text - and text moving x/y/z.
			//   (Text stuffs should be similar to nextBackgrounds etc.)

			//TEST!!!! 
			//masterGrid.getSubgrid(0).invoke('ripple');
			// setTimeout(function(){
			// 	console.log('timeout function fired');
			// 	masterGrid.getSubgrid(0).
			// 		setOption('background','url(images/Fractal_Broccoli.jpg)').
			// 		invoke('setNextBackground').
			// 		invoke('ripple');
			// },3000);
			
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