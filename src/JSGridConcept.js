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
			setBackground : function(){
				for(var x=0;x<cells.length;x++){
					cells[x].setBackground();
				}
			},
			setRollover : function(){
				for(var x=0;x<cells.length;x++){
					cells[x].rollover();
				}
			},		
			ripple : function(){
				var chainsFired = [];
				$.each(cells,function(i, cell){
					gridQueue.queue('ripple',function(next){
						setTimeout(function(){
							if(cell instanceof Cell){
								cell.nextState();
							}else{
								if($.inArray(cell,chainsFired)==-1 && $.inArray('ripple',subgrids[cell].getOption('chainMethods'))!=-1){
									subgrids[cell].invoke('ripple');
									chainsFired.push(cell);
								}								
							}
							next();
						},25);
					});
				});
				gridQueue.dequeue('ripple');
			},
			setNextBackground : function(){
				$.each(cells,function(i, cell){
					cell.setOption('background',options.background).setNextBackground();
				});
			}
		};	
		
		var initgrid = function(){
			for(var x=0;x<options.initMethods.length;x++){
				if(methods[options.initMethods[x]]){
					methods[options.initMethods[x]].call(arguments);
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
				methods[method].call(Array.prototype.slice.call(arguments,1));
			}
			//make chainable(?)
			return this;
		};

		this.injectMethod = function(method,newmethod){
			methods[method] = newmethod;			
		};

		this.setOption = function(option,value){
			options[option] = value;
			console.log(options[option]);
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
				if(i!=(x-1)){
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
			cell$.find('.cube').removeClass().addClass(nextClasses[x]).addClass('cube');
			x<nextClasses.length ? x++ : x=0;
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
			background: 'url(http://fireflyforest.net/images/firefly/2011/August/psychedelic-violet.jpg)',
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
			setInterval(function(){masterGrid.invoke('ripple')},4000);

			//test out some subgrid allocations
			masterGrid.injectGrid({
				rows:6,
				cols:4,
				initMethods : ['setBackground','setRollover'],
				background: 'url(http://www.pictureworldbd.com/Flower/image/lotus/pink_lotus_flower_wallpaper.jpg)',
				chainMethods: []
			},4,0);
			//TEST!!!! 
			masterGrid.getSubgrid(0).invoke('ripple');
			setTimeout(function(){
				console.log('timeout function fired');
				masterGrid.getSubgrid(0).
					setOption('background','url(http://upload.wikimedia.org/wikipedia/commons/4/4f/Fractal_Broccoli.jpg)').
					invoke('setNextBackground').
					invoke('ripple');
			},3000);
			
			// masterGrid.injectGrid({
			// 	rows:4,
			// 	cols:4,
			// 	initMethods : ['setBackground','setRollover'],
			// 	background: 'url(http://upload.wikimedia.org/wikipedia/commons/4/4f/Fractal_Broccoli.jpg)',
			// 	chainMethods: ['ripple']
			// },0,2);
			//setInterval(function(){masterGrid.subgrids[1].invoke('ripple')},2900);
		});
	};
})(jQuery);

$(function(){
	$('#gridconcept').JSGridConcept({
		rows: 6,
		cols: 8,
		background: 'url("http://cdn.all-that-is-interesting.com/wordpress/wp-content/uploads/2012/02/coastline-of-maui.jpg")'
	});
});