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
		this.cells = []; 
		this.subgrids = [];
		var z=0;
		//Grid Queue Object
		var gridQueue = $({});
		//populate array with cells
		for(var x=0;x < options.rows;x++){
			//var row = [];
			for(var y=0;y < options.cols;y++){
				var cellOptions = {
					backgroundX : y > 0 ? options.cellOffset*y : y, 
					backgroundY : x > 0 ? options.cellOffset*x : x,
					background : options.background
				};
				this.cells.push(new Cell(cellOptions,$(elem$[z])));
				//row[y] = new Cell(cellOptions,$(elem$[z]));
				z++;
			}
			//this.cells.push(row);
		}

		//Grid specific methods
		var methods = {
			setBackground : function(){
				for(var x=0;x<this.cells.length;x++){
					this.cells[x].setBackground();
				}
			},
			setRollover : function(){
				for(var x=0;x<this.cells.length;x++){
					this.cells[x].rollover();
				}
			},		
			ripple : function(){
				$.each(this.cells,function(i, cell){
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
				if (methods[options.initMethods[x]]) {
					methods[options.initMethods[x]].apply(this);
				}
			}
		};
		this.injectGrid = function(subGrid$,sgoptions){
			var sgoptions = $.extend(options,sgoptions);
			//work out X/Y positions.
			var affectedPos = [4,5,12,13];
			//change cells reference to hold a reference to this subgrid, rather than specific elements.
			for(var x=0;x<affectedPos.length;x++){
				this.cells[affectedPos[x]].unbind();
				this.cells[affectedPos[x]] = this.subgrids.length+1;				
			}
			//unbind events on existing cells.
			this.subgrids.push(new Grid(subGrid$,sgoptions));
		};

		this.invoke = function(method){
			if (methods[method]) {
				return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
			}
		}
		//carry out some default init behaviour..
		initgrid.apply(this);
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
			var subGrid$ = [masterGridCells[4],masterGridCells[5],masterGridCells[12],masterGridCells[13]];
			//masterGrid.injectGrid(new Grid(subGrid$,$.extend(options,{rows:2,cols:2,initMethods : ['setBackground','setRollover'],background: 'url(http://www.pictureworldbd.com/Flower/image/lotus/pink_lotus_flower_wallpaper.jpg)'})));
			masterGrid.injectGrid(subGrid$,{rows:2,cols:2,initMethods : ['setBackground','setRollover'],background: 'url(http://www.pictureworldbd.com/Flower/image/lotus/pink_lotus_flower_wallpaper.jpg)'});
			setTimeout(function(){masterGrid.invoke('ripple')},1000);
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