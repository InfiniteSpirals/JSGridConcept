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
		//calculate offset.
		options.cellOffset = options.cellDiam + options.cellMargin;		
		//define collection of elements and array of cells.
		var cells = []; 
		this.subgrids = [];
		var z=0;
		//Grid Queue Object
		var gridQueue = $({});
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
			//cells.push(row);
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
				$.each(cells,function(i, cell){
					gridQueue.queue('ripple',function(next){
						setTimeout(function(){
							if(cell instanceof Cell) cell.nextState();
							next();
						},25);
					});
				});
				gridQueue.dequeue('ripple');
			}
		};	
		
		var initgrid = function(){
			for(var x=0;x<options.initMethods.length;x++){
				if(methods[options.initMethods[x]]){
					methods[options.initMethods[x]].call(arguments);
				}
			}
		};
		this.injectGrid = function(sgoptions,xstart,ystart){
			//take defaults for this grid, extend with subgrid options.
			var sgoptions = $.extend({},options,sgoptions);
			//work out X/Y positions.
			//n.b will need to add some testing to check its within dimensions here
			var subGrid$ = [];
			for(var y=0;y<sgoptions.rows;y++){
				var firstcell = ((options.cols * ystart) + (options.cols * y)) + xstart;
				var test = options.cols *y;
				for(var x=0;x<sgoptions.cols;x++){
					var pos = firstcell+x;
					//assign jquery wrapped cell HTMLElement to subgrid elements array.
					subGrid$.push(elem$[pos]);
					//whilst we're in this loop, we have the affected position reference so we can
					//unbind any events bound to cell element in master grid.
					cells[pos].unbind();
					//... and add a reference to the subgrid into this grids cells array.
					cells[pos] = this.subgrids.length;
				}
			}
			//create the subgrid and push it into the subgrids array of this grid.
			this.subgrids.push(new Grid(subGrid$,sgoptions));
		};

		this.invoke = function(method){
			if (methods[method]) {
				return methods[method].apply(this,Array.prototype.slice.call(arguments,1));
			}
		}

		this.injectMethod = function(method,newmethod){
			methods[method] = newmethod;			
		}

		this.setOption = function(option,value){
			options[option] = value;
		}

		this.getOption = function(option){
			return options[option] || '';			
		}
		//carry out some default init behaviour..
		initgrid();
	};	

	//Cell Constructor
	var Cell = function(options,cell$){
		var nextClasses = ['show-left','show-right','show-front','show-back'];
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
				rows:2,
				cols:2,
				initMethods : ['setBackground','setRollover'],
				background: 'url(http://www.pictureworldbd.com/Flower/image/lotus/pink_lotus_flower_wallpaper.jpg)'
			},4,0);
			setInterval(function(){masterGrid.subgrids[0].invoke('ripple')},2000);
			
			masterGrid.injectGrid({
				rows:4,
				cols:4,
				initMethods : ['setBackground','setRollover'],
				background: 'url(http://upload.wikimedia.org/wikipedia/commons/4/4f/Fractal_Broccoli.jpg)'
			},0,2);
			setInterval(function(){masterGrid.subgrids[1].invoke('ripple')},2900);
		});
	};
})(jQuery);

$(function(){
	// $('#gridconcepttwo').JSGridConcept({
	// 	rows: 8,
	// 	cols: 6,
	// 	background: 'url(http://www.pictureworldbd.com/Flower/image/lotus/pink_lotus_flower_wallpaper.jpg)'
	// });
	$('#gridconcept').JSGridConcept({
		rows: 6,
		cols: 8,
		background: 'url("http://cdn.all-that-is-interesting.com/wordpress/wp-content/uploads/2012/02/coastline-of-maui.jpg")'
	});
	// $('#gridconceptthree').JSGridConcept({
	// 	rows: 6,
	// 	cols: 8,
	// 	background: 'url("http://cdn.all-that-is-interesting.com/wordpress/wp-content/uploads/2012/02/coastline-of-maui.jpg")'
	// });

});