/*! Jsgridconcept - v0.0.1 - 2013-02-04
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
		this.queueInProgress = false;
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
		var setQueueInProgress = function(status){
			this.queueInProgress = status;
		}
		var getQueueInProgress = function(){
			return this.queueInProgress;
		}
		//storyboardin' queue! 
		//this manages the storyboards created from the collection function
		//called by user.
		var sbQueueCallback, sbMonitor, sbIsMonitoring = false;
		var sbQueue = this.sbQueue = function(callback){
			if(callback){
				sbQueueCallback = callback;
			}
			if(!testAnimation()){
				if(sbIsMonitoring){
					clearInterval(sbMonitor);
					sbIsMonitoring = false;
				}
				setTimeout(function(){
					sbQueueCallback.call();
				},options.sbpause);
			}else{
				if(!sbIsMonitoring){
					sbIsMonitoring = true;
					sbMonitor = setInterval(sbQueue,250);
				}
			}
		}
		//Grid specific methods
		var methods = {
			setAfter : function() {
				
				if(!testAnimation()){
					methods['setBackground']();
					methods['setNextBlockText']();
					if(options.rollover) methods['setRollover']();
				}else{
					setTimeout(methods['setAfter'],250);
				}
			},
			setBackground : function(){
				//use $.each - remember to do this!
				for(var x=0;x<cells.length;x++){
					if(cells[x] instanceof Cell){
						cells[x].setBackground();
					}
				}
			},
			setRollover : function(){
				options.rollover = true;
				//use $.each - remember to do this!
				for(var x=0;x<cells.length;x++){
					if(cells[x] instanceof Cell){
						cells[x].rollover();
					}
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
					//console.log('debug - i=' + i + ' firstcell=' + firstcell + ' strText=' + strText);
					//now loop through each character in the string
					var letters = strText.split('');
					$.each(letters,function(j, letter){
						//console.log('j=' + j + ' letter=' + letter + ' firstcell+j=' + (firstcell+j));
						if(cells[firstcell+j] instanceof Cell){
							if(!bnext){
								cells[(firstcell+j)].setHTML('<span>' + letter + '</span>');
							}else{
								cells[(firstcell+j)].setNextHTML('<span>' + letter + '</span>');
							}
						}
					});
				});
			},
			setNextBlockText : function(){
				$.each(cells,function(i, cell){
					if(cell instanceof Cell){
						cell.setNextHTML('');
					}
				});
				methods['setBlockText'](true);
			},	
			ripple : function(rtype){
				//unbind all rollovers... else we can get nasty messes.
				$.each(cells,function(i,cell){
					if(cell instanceof Cell){
						cell.unbind();
					}
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
								setQueueInProgress(false);
							}
							next();
						},dur);
					});
				});
				setQueueInProgress('true');
				gridQueue.dequeue('ripple');
			},
			setNextBackground : function(){
				$.each(cells,function(i, cell){
					if(cell instanceof Cell){
						cell.setOption('background',options.background).setNextBackground();
					}
				});
			},
			scrollMessage : function(ystart,text){
				//console.log('here!!');
				//bit of an experiment, not sure how relevant this is to a GRID.
				//but if you wanted to create a single line "Grid" this might look pretty cool.
				//or you could have have scrolling  "narration" for a slide show?
				var ystart = ystart || options.scrollXRow;
				var text = text || options.scrollText;
				//console.log('ystart =' + ystart + ' text=' +text);
				//cells to animate..
				var cellsPos = [];
				//get the cells position for the row to scroll on.
				var firstcell = options.cols * (ystart-1);
				for(var x=0;x<options.cols;x++){
					cellsPos.push(firstcell+x);
				}
				//sort out text. if it's smaller than col length, add spaces.
				//also - add equal number of spaces as col length so it scrolls off screen...
				for(var ispc=0;ispc<(text.length<options.cols ? (options.cols+(options.cols-text.length)) : options.cols);ispc++){
					text += ' '; 
				}

				//text into arr...
				var aText = text.split('');
				var cellsAnim = [];
				var y=0;
				//loop through in reverse...
				cellsPos.reverse();
				for(var x=0;x<(aText.length>=cellsPos.length ? aText.length : cellsPos.length);x++){
					cellsAnim.push(cells[cellsPos[x]]);
					gridQueue.queue('scroll',function(next){
						for(var z=0;z<=y;z++){						
							if(cellsAnim[z] instanceof Cell){
								if(options.scrollAnim){
									cellsAnim[z].setNextHTML('<span>' + (y<aText.length ? aText[y-z] : ' ') + '</span>',true);
									cellsAnim[z].nextState(true);
								}else{
									cellsAnim[z].setHTML('<span>' + (y<aText.length ? aText[y-z] : ' ') + '</span>');
								}
							}
						}
						var statusMonitor, isCheckingStatus = false;
						var checkStatusNext = function(){
							var test = false;
							for(var z=0;z<=y;z++){
								if(cellsAnim[z] instanceof Cell){
									if(cellsAnim[z].getCellTransitionStatus()) test = true;
								}
							};
							if(!test){
								if(gridQueue.queue('scroll').length == 0) {
									setQueueInProgress(false);
								}
								if(isCheckingStatus){
									clearInterval(statusMonitor);
									isCheckingStatus = false;
								}
								next();
							}else{
								if(!isCheckingStatus){
									isCheckingStatus = true;
									statusMonitor = setInterval(checkStatusNext,15);
								}
							}
						}
						if(options.scrollAnim){
							checkStatusNext();
						}else{
							setTimeout(function(){
								if(gridQueue.queue('scroll').length == 0) {
									setQueueInProgress(false);
								}
								next();
							},options.scrollNonAnimDuration);
						}
						y++;
					});
				}
				setQueueInProgress('true');
				gridQueue.dequeue('scroll');
			}
		};	
		
		//this is to test if all animations are complete for this grid.
		this.isAnimating = false;
		var animMonitor, isMonitoring = false;
		var monitorAnimation = function(){
			if(options.isSubgrid){
				//console.log('this is a subgrid -in monitor animation...');
			}else{
				//console.log('not a subgrid...');
			}
			if(!getQueueInProgress()){
				var test = false;
				// //to make doubly sure (no pun intended..) check the cells twice.
				// //there is potential for a small window when all cells can read as false
				// //in the very small gap between animations.
				for(var ii=0;ii<2;ii++){
					$.each(cells,function(i, cell){
						if(cell instanceof Cell && cell.getCellTransitionStatus()){
							test = true;
						}
					});
				}
				if(test){
					this.isAnimating = true;
					if(!isMonitoring){
						isMonitoring = true;
						animMonitor = setInterval(monitorAnimation,500);
					}
				}else{
					if(isMonitoring){
						isMonitoring=false;
						clearInterval(animMonitor);
					}
					this.isAnimating = false;
					
				}
			}else{
				this.isAnimating = true;
				if(!isMonitoring){
					isMonitoring = true;
					animMonitor = setInterval(monitorAnimation,500);
				}
			}
		};

		var testAnimation =  this.testAnimation = function(){
			monitorAnimation();
			return this.isAnimating;				
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
			subgrids.push(new Grid(subGrid$,sgoptions).setOption('isSubgrid','true'));
		};

		this.getSubgrid = function(id){
			//robustify??
			return subgrids[id];
		};

		this.invoke = function(method){
			if (methods[method]) {
				methods[method].apply(this,Array.prototype.slice.call(arguments,1));
			}
			//make chainable
			return this;
		};
		//might make use of this in future for diff adapters etc.
		this.injectMethod = function(method,newmethod){
			methods[method] = newmethod;			
		};

		this.setOption = function(option,value){
			options[option] = value;
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
		var nextClasses = ['show-front','show-left','show-front','show-top'];
		var nextClassesScroll = ['show-front','show-scroll','show-scroll1','show-scroll2'];
		var nextFaces = ['front','left','front','top'];
		var nextFacesScroll = ['front','left','back','right'];
		var binded = [];
		var x=0;
		var xScroll=0;

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
			//loop through all faces in array.
			//we want to set BG on all faces aside from the one 
			//we are already on. 
			//One we are already on is represented by X.
			//console.log('current face=' + nextFaces[x]);
			for(var i=0;i<nextFaces.length;i++){
				if(i!=x&&nextFaces[i]!=nextFaces[x]){
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
		this.setNextHTML = function(strHTML,bScroll){
			var bScroll = bScroll || false;
			var nextFace = bScroll ? nextFacesScroll : nextFaces;
			var xx = bScroll ? xScroll : x;
			for(var i=0;i<nextFace.length;i++){
				if(i!=xx&&nextFace[i]!=nextFace[xx]){
					cell$.find('.' + nextFace[i]).html(strHTML);
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

		this.nextState = function(bScroll){
			//console.log('nextState');
			var bScroll = bScroll || false;
			if(!transitionInProgress){
				if(bScroll){
					xScroll<(nextClassesScroll.length-1) ? xScroll++ : xScroll=0;
				}else{
					x<(nextClasses.length-1) ? x++ : x=0;
				}
				var nextClass = bScroll ? nextClassesScroll : nextClasses;
				var xx = bScroll ? xScroll : x;
				transitionInProgress = true;
				cell$.find('.cube').removeClass().addClass(nextClass[xx]).addClass('cube');
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
			cellType: 'cube',
			scrollAnim: true,
			scrollNonAnimDuration: 100,
			isSubgrid: false,
			text: '',
			textxstart: 1,
			textystart: 1,
			background: 'url(images/psychedelic-violet.jpg)',
			skin: '<div class="cell"><div class="cube show-front"><div class="face front"></div><div class="face back"></div><div class="face right"></div><div class="face left"></div><div class="face top"></div><div class="face bottom"></div></div</div>', 
			initMethods: ['setBackground','setBlockText']
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
			masterGrid.injectGrid({
				rows:1,
				cols:8,
				initMethods : ['setBackground'],
				background: 'url("images/coastline-of-maui.jpg")',
				scrollAnim:true,
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
				masterGrid.getSubgrid(0).invoke('scrollMessage',1,'hello there!! why not read this!?');
			},500);
			
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