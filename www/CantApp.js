var isSmallScreen=false;
var isSmallWindow=false;
var Gaps = new Array ();
Gaps["1"]=1;
Gaps["19"]=1;
Gaps["30"]=1;
Gaps["46"]=1;
var currView="MS"  //choices: NT MS TJ NG (last in small window/mobile only)
var line=0;
var currAudioLine=0;
var currentPage="1r";
var viewport = {width  : 0,height : 0};
var warnedSize=false;
var audioPlayer;
var mediaPlayer=null;
var audioPlaying=false;
var pageInit=false;
var beforeResize = {height:0,width:0}



$(document).bind("pageinit", function(){
     if (pageInit) return;
     console.log(GP.length);
     pageInit=true;
     beforeResize.width=viewport.width  = $(window).width();
     beforeResize.height=viewport.height = $(window).height();
 //    $("body").height(viewport.height);
     $("body").width(viewport.width);
     // 	$("#Buttons").height(120);
     $( "#LineInf" ).hide();
     //  	$("#footer").hide();
     $('#msImage').attr("width", viewport.width);
     $("#msImage").attr("src", "msimages/2R.JPG");
     $("#Image").show();
     $("#Glosses").hide();
     $("#Notes").hide();
     $("#Text").hide();
     $("#NotesGlosses").hide();
     $("#NotesGlossesBox").hide();
     $("#BodyText").height(viewport.height);
     $("#Glosses").css({'left':$("body").width()});
     $("#stopAudioLink").hide();

     if (screen.width<500) $(".buttons").css({height:40});
     //   	$("#apAdjust").hide();
     $( "input" ).on( "slidestop", function( event, ui ) {moveText();} );
     $(window).bind("throttledresize", function() {adjustViews();})
     $('#Text').attr("data-view", currView);
     //media player is the phonegap player
     populateText(false);
     setUpArrows("image");
     $( "#BodyText" ).scroll(function() {
     	if ($("#msImage").is(":visible"))
		  setUpArrows("image");
		else setUpArrows("text");
	 });
     //set up slider
     $("#slider0").change(function(event, ui) {
     	var val = $('#slider0')[0].value;  //not nice. but it works and others don't
     	var part = "Introduction";
     	for (var i=0; i<Parts.length; i++) {
     		if (Parts[i].start<=val && Parts[i].end >= val) {
     			part=Parts[i].part;
     		}
     	}
     	$("#Place").html(part);
     });
      $("#msImage").mousemove(function(event) {
      	if (!audioPlaying) {
      		//are we within the page frame for this page?
      		var myImage = $("#msImage").attr("src").slice($("#msImage").attr("src").indexOf("/")+1);
      		var thisPage=null;
			for (var i in GP_Images) {
				if (GP_Images[i].image==myImage) {
					thisPage={page: i, pageInf: GP_Images [i]};
					break;
				}
			}
			var winwidth=$("#msImage").width();
    		var factor=winwidth/thisPage.pageInf.full_x;
    		var scrolltop=$("#BodyText").scrollTop();
    		var thisLine=0;
    		//could be: above frame of first page. Do the rubric!
    		if (thisPage.page=="1r" && scrolltop==0 && event.pageX >(thisPage.pageInf.rubric_l*factor) && event.pageX<(thisPage.pageInf.frame_r*factor) &&  event.offsetY >scrolltop+(thisPage.pageInf.rubric_t*factor) && event.offsetY <scrolltop+ (thisPage.pageInf.frame_t*factor)) {
    			var top=(thisPage.pageInf.rubric_t-70)*factor;
				var left=thisPage.pageInf.rubric_l*factor;
				$('#msLIneBox').css({top: (thisPage.pageInf.rubric_t+40)*factor, left:thisPage.pageInf.rubric_l*factor, width: (thisPage.pageInf.frame_r-thisPage.pageInf.frame_l+100)*factor, height: 150*factor})
				$('#msLIneBox').show();
				$( "#TJPULine").html(GP_TJ[0].TJ);
				$( "#NTPULine").html(GP[0].NT)
				$('#PUText').css({top: top, left: left});
				$('#PUText').show();
    		} else if (event.pageX >(thisPage.pageInf.frame_l*factor) && event.pageX<(thisPage.pageInf.frame_r*factor) && event.offsetY+scrolltop >scrolltop+(thisPage.pageInf.frame_t)*factor && event.offsetY+scrolltop <scrolltop+(thisPage.pageInf.frame_b)*factor ) {
				var spacePerLine=((thisPage.pageInf.frame_b-thisPage.pageInf.frame_t)/thisPage.pageInf.nlines)*factor;
				for (var i=0; i<thisPage.pageInf.nlines; i++) {
					if (scrolltop+(thisPage.pageInf.frame_t*factor)+(i*spacePerLine)<=event.offsetY+scrolltop && event.offsetY+scrolltop<=scrolltop+(thisPage.pageInf.frame_t*factor)+((i+1)*spacePerLine)) {
						thisLine=i;
						i=thisPage.pageInf.nlines
					}
				}
				if (line!=thisLine+thisPage.pageInf.firstl) {
	//				console.log("Line changed. Old line is "+line+", new line is "+(thisLine+thisPage.pageInf.firstl)+", x is "+event.pageX+" y is "+(event.pageY+$("#BodyText").scrollTop()));
	// how many lines are visible.. or if we event.y is within four lines of the bottom...
					line=thisLine+thisPage.pageInf.firstl;
					var arrayline=getArrayLine(line);
					$( "#TJPULine").html(arrayline+" "+GP_TJ[arrayline].TJ);
					$( "#NTPULine").html(GP[arrayline].NT);
					if (line!=0) {
						$('#msLIneBox').show();
						var offsetTop=60-$("#msImage").height()/15;
						if (arrayline=="1") {
							$('#msLIneBox').css({'width': (GP_Images[GP[arrayline].page].frame_r-GP_Images[GP[arrayline].page].frame_l)*factor, 'height': spacePerLine*2.5});
							$('#msLIneBox').css({top: (thisPage.pageInf.frame_t*factor), left: GP_Images[GP[arrayline].page].frame_l*factor});
						} else {
							$('#msLIneBox').css({'width': (GP_Images[GP[arrayline].page].frame_r-GP_Images[GP[arrayline].page].frame_l)*factor, 'height': spacePerLine*1.8});
							$('#msLIneBox').css({top: (thisPage.pageInf.frame_t*factor)+thisLine*spacePerLine, left: GP_Images[GP[arrayline].page].frame_l*factor});
						}
						if ($('#Notes').is(':visible') && event.pageY>$(window).height()-$("#Notes").height()-(spacePerLine*4))
							$('#PUText').css({top: (thisPage.pageInf.frame_t*factor)+(thisLine-3)*spacePerLine, left: GP_Images[GP[arrayline].page].frame_l*factor});
						else if ($('#footer').is(':visible') && event.pageY>$(window).height()-(spacePerLine*4))
							$('#PUText').css({top: (scrolltop+thisPage.pageInf.frame_t*factor)+(thisLine-3)*spacePerLine, left: GP_Images[GP[arrayline].page].frame_l*factor});
						else if  (!$('#footer').is(':visible') && event.pageY>$(window).height()-(spacePerLine*3))
							$('#PUText').css({top: (thisPage.pageInf.frame_t*factor)+(thisLine-3)*spacePerLine, left: GP_Images[GP[arrayline].page].frame_l*factor});
						else
					    	$('#PUText').css({top: (thisPage.pageInf.frame_t*factor)+(thisLine+2)*spacePerLine, left: GP_Images[GP[arrayline].page].frame_l*factor});
						$('#PUText').show();
	//					$('#PUText').css({top: 400});
					}
				}
			} else {
//				$('#PUText').hide();
//				$('#msLIneBox').hide();
			}
    	}
      });

});

function setUpArrows(which) {
	 var scrolltop=$("#BodyText").scrollTop();
     if (which=="image") {
     	//calculate if glosses or notes are visible...
     	if ($('#Glosses').is(':hidden') && $('#Notes').is(':hidden')) {
     		var nTop=scrolltop+($(window).height()-64)/2;
     		var nLeft=$(window).width()-64;
     		$('#imageLeftArrow').css({top: nTop+"px", left:"0px"});
      		$('#imageRightArrow').css({top: nTop+"px", left:nLeft+"px"});
     	} else if ($('#Glosses').is(':visible') && $('#Notes').is(':visible')) {
     		var nTop=scrolltop+(($(window).height()-$("#Notes").height()-64)/2);
     		var nRight=$(window).width()-128-$('#Glosses').width();
     		$('#imageLeftArrow').css({top: nTop+"px", left:"0px"});
      		$('#imageRightArrow').css({top: nTop+"px", left:nRight+"px"});
     	} else if ($('#Glosses').is(':visible')) {
     		var nTop=scrolltop+(($(window).height()-64)/2);
     		var nRight=$(window).width()-64-300;
     		$('#imageLeftArrow').css({top: nTop+"px", left:"0px"});
      		$('#imageRightArrow').css({top: nTop+"px", left:nRight+"px"});
     	} else if ($('#Notes').is(':visible')) {
     		var nTop=scrolltop+(($(window).height()-$("#Notes").height()-64)/2);
     		var nRight=$(window).width()-64;
     		$('#imageLeftArrow').css({top: nTop+"px", left:"0px"});
      		$('#imageRightArrow').css({top: nTop+"px", left:nRight+"px"});
     	}
     }
    if (which=="text") {
     	//calculate if glosses or notes are visible...
     	if ($('#Glosses').is(':hidden') && $('#Notes').is(':hidden')) {
     		var nTop=($(window).height()-64)/2;
     		var nLeft=$('#msImage').attr("width")-64;
     		$('#textLeftArrow').css({top: nTop+"px", left:"0px"});
      		$('#textRightArrow').css({top: nTop+"px", left:nLeft+"px"});
     	}  else if ($('#Glosses').is(':visible') && $('#Notes').is(':visible')) {
     		var nTop=($(window).height()-$("#Notes").height()-64)/2;
     		var nRight=$(window).width()-128-$('#Glosses').width();
     		$('#textLeftArrow').css({top: nTop+"px", left:"0px"});
      		$('#textRightArrow').css({top: nTop+"px", left:nRight+"px"});
     	}  else if ($('#Glosses').is(':visible')) {
     		var nTop=($(window).height()-64)/2;
     		var nRight=$(window).width()-64-300;
     		$('#textLeftArrow').css({top: nTop+"px", left:"0px"});
      		$('#textRightArrow').css({top: nTop+"px", left:nRight+"px"});
     	}  else if ($('#Notes').is(':visible')) {
     		var nTop=($(window).height()-$("#Notes").height()-64)/2;
     		var nRight=$(window).width()-64;
     		$('#textLeftArrow').css({top: nTop+"px", left:"0px"});
      		$('#textRightArrow').css({top: nTop+"px", left:nRight+"px"});
     	}
     }
 }
function prevMS() {
	hideButtons();
	if ($("#Image").is(":visible")) {
		//figure out where we are and what we are going to show...
		//which image?
		var myImage = $("#msImage").attr("src").slice($("#msImage").attr("src").indexOf("/")+1);
		var thisPage={};
		var gotThisPage=false;
		var prevPage=null;
		for (var i in GP_Images) {
			if (GP_Images[i].image==myImage) {
    			thisPage={page: i, pageInf: GP_Images [i]};
    			break;
     		}
 		prevPage={page: i, pageInf: GP_Images [i]};
  	}
	var winheight=$(window).height();
	var winwidth=$(window).width();
	var scrolltop=$("#BodyText").scrollTop();
	if ($("#Glosses").is(":visible")) winwidth-=300;
	if ($("#Notes").is(":visible")) winheight=winheight/2;
	var factor=winwidth/thisPage.pageInf.full_x;
	var topFrameSize=thisPage.pageInf.frame_t*factor;
    var bottomFrameStart=thisPage.pageInf.frame_b*factor;
    var spacePerLine=((thisPage.pageInf.frame_b-thisPage.pageInf.frame_t)/thisPage.pageInf.nlines)*factor;
    if (scrolltop>0) {
    	if (scrolltop>winheight-(spacePerLine*2))  {
    		$("#BodyText").scrollTop(scrolltop-winheight+(spacePerLine*2));
    		if ($("#Glosses").is(":visible")) $("#Glosses").css({top: $("#BodyText").scrollTop()});
    		line-=Math.floor((winheight/spacePerLine)-2);
    	} else {
    		$("#BodyText").scrollTop(0);
    		if ($("#Glosses").is(":visible")) $("#Glosses").css({top:"0"});
    		line=thisPage.pageInf.firstl;
    		if (!prevPage) $("#imageLeftArrow").hide();
    	}
    }
    else { //leap to previous page
    	$("#msImage").attr("src", "msimages/"+prevPage.pageInf.image);
    	$("#BodyText").scrollTop((prevPage.pageInf.full_y*factor)-winheight+(spacePerLine*2));
    	if ($("#Glosses").is(":visible")) $("#Glosses").css({top: $("#BodyText").scrollTop()});
    	line=prevPage.pageInf.firstl+prevPage.pageInf.nlines-Math.floor(winheight/spacePerLine)+Math.floor((prevPage.pageInf.full_y-prevPage.pageInf.frame_b)*factor/spacePerLine)+1;
    }
    updateCaptions();
  }
}

function nextMS() {
//	$("#footer").hide();
//	$("#Buttons").hide();
	hideButtons();
	if ($("#Image").is(":visible")) {
		//figure out where we are and what we are going to show...
		//which image?
		var myImage = $("#msImage").attr("src").slice($("#msImage").attr("src").indexOf("/")+1);
		var thisPage={};
		var gotThisPage=false;
		var nextPage=null;
		for (var i in GP_Images) {
			if (gotThisPage) {
				nextPage={page: i, pageInf: GP_Images [i]};
				break;
			}
    		if (GP_Images[i].image==myImage) {
    			thisPage={page: i, pageInf: GP_Images [i]};
    			gotThisPage=true;
     		}
    	}
    	var nextStartLine=thisPage.pageInf.firstl;
    	//ok.. where are we on this page? how far have we scrolled?
    	//especially.. what is the last line visible?
    	//SO: how much window is visible? -- if notes are visible, it will be half this
    	var winheight=$(window).height();
    	var winwidth=$(window).width();
    	var scrolltop=$("#BodyText").scrollTop();
    	if ($("#Glosses").is(":visible")) winwidth-=300;
    	if ($("#Notes").is(":visible")) winheight=winheight/2;
    	var factor=winwidth/thisPage.pageInf.full_x;
    	var fullWinHeight=thisPage.pageInf.full_y*factor;
    	var topFrameSize=thisPage.pageInf.frame_t*factor;
    	var bottomFrameStart=thisPage.pageInf.frame_b*factor;
    	var spacePerLine=((thisPage.pageInf.frame_b-thisPage.pageInf.frame_t)/thisPage.pageInf.nlines)*factor;
    	//if beforeline is negative..we are some lines down
    	//really simple! scroll up winheight less one line space.. unless we have scrolled to the bottom
    	//then figure out what line is at the top of the page
    	//either: we have not scrolled the whole page yet..modified. If top of scroll is almost in bottom frame... go ahead
    	if ((scrolltop+winheight+10)<fullWinHeight && (scrolltop + winheight/2)<bottomFrameStart) {
  			$("#BodyText").scrollTop(scrolltop+winheight-(spacePerLine*3));
  			if ($("#Glosses").is(":visible")) $("#Glosses").css({top: $("#BodyText").scrollTop()});
  			 var pagePlace=$("#BodyText").scrollTop()+spacePerLine;
  			if (pagePlace<=topFrameSize) nextStartLine+=0;
  			else if (pagePlace>=bottomFrameStart) nextStartLine+=thisPage.pageInf.nlines+1;
  			else nextStartLine+=Math.floor((pagePlace-topFrameSize)/spacePerLine);
  		}
  		else {
  			if (nextPage) {
  				$("#msImage").attr("src", "msimages/"+nextPage.pageInf.image);
  				$("#BodyText").scrollTop(0);
  				if ($("#Glosses").is(":visible")) $("#Glosses").css({top: 0});
  				nextStartLine=nextPage.pageInf.firstl;
  			} else {
  				$("#imageRightArrow").hide();
  			}
  		}
  		$("#imageLeftArrow").show();
  		line=nextStartLine;
  		updateCaptions();
 	}
}

function adjustText(newHeight, oldHeight) {
	var inResizeHeight=false;
	if (currView=="MS") return;
	var last_p=$("#TextNTJ p:last-child");
	var last_height=$("#TextNTJ p:last-child").height();
    if (newHeight<oldHeight) {
        while (newHeight+last_height<=oldHeight+1) {
            inResizeHeight=true;
            last_p=$("#TextNTJ p:last-child");
            last_height=$("#TextNTJ p:last-child").height();
            last_p.remove();
            oldHeight-=last_height;
        }
    }
	else {
        while (newHeight>=oldHeight+last_height-2) {
            inResizeHeight=true;
            last_p=$("#TextNTJ p:last-child");
            var skipGap=false;
            if (last_p.attr("class")=="PLine3") {
                skipGap=true;
                last_p=$('#TextNTJ').children('p.PLine').last()
            }
            var last_n= parseInt(last_p.attr("data-arrayn"));
            if (last_n<GP.length) {
                var newp=createNTJLine(last_n+1, $("#Text").attr("data-view"), skipGap);
                $("#TextNTJ").append(newp);
                last_height=newp.height();
                oldHeight+=last_height;
            }
        }
    }
	return inResizeHeight;
}

function hideButtons () {
		$("#footer").hide();
		$("#Buttons").hide();
		$("#toggleMenus").show();
}

function showButtons (){
		$("#footer").show();
		$("#Buttons").show();
		$("#toggleMenus").hide();
}

function adjustViews() {
	var arrayline=getArrayLine(line);
	var inResizeHeight=false;
	var inResizeWidth=false;
    if (!isSmallScreen) {
      if (windowNeedsEnlarging()) {
        if (!warnedSize) {
            alert("The CantApp is optimized for a window 1024 by 768 pixels.\r(Current height: "+$(window).height()+", width "+$(window).width()+")");
            warnedSize=true;
        }
        setUpSmallScreen();
      } else  setUpBigScreen();
    } else setUpSmallScreen();
	if (currView!="MS" && $(window).height()!=beforeResize.height) {
		if ($('#Notes').is(':visible')) {
			//half the window is note, half is text...
			if ($('#Glosses').is(':visible')) {
				$("#Glosses").css({height:($(window).height()/2)+10, backgroundSize: "300px "+(($(window).height()/2)+10)+"px"});
			}
			inResizeHeight=adjustText(($(window).height()/2)+5, $("#BodyText").height());
			$("#Notes").height($(window).height()/2-30);
			$("#BodyText").height($(window).height()/2);
			activateBiblios();
		} else {
            if (currView=="NT" || currView=="TJ") {
                inResizeHeight=adjustText($(window).height(), beforeResize.height);
                if (inResizeHeight) {
                    beforeResize.height=$(window).height();
                }
                var position = $("p[data-n='"+GP[arrayline].n+"']").position();
                $('#LineInf').animate({top: position.top-30, left: position.left-50});
            }
			//if we have gloss showing...
			if ($('#Glosses').is(':visible')) {
				$("#Glosses").css({height:$(window).height(), backgroundSize: "300px "+$(window).height()+"px"});
			}
			$('#BodyText').height($(window).height());
            if ($('#NotesGlossesBox').is(':visible')) {
                $("#NotesGlossesBox").css({marginLeft: ($('body').width()-540)/2});
                $("#NotesGlossesBox").css({marginRight: ($('body').width()-540)/2});
                $("#NotesGlossesText").css({top: $("#NotesGlossesBox").height()});
                $("#NotesGlosses").css({width: $('body').width()});
            }
            activateBiblios();
		}
		//clean up here...
		setUpArrows("text");
	}
	if (currView=="MS" && $(window).height()!=beforeResize.height) {
		//change msLineBox size

		var myImage = $("#msImage").attr("src").slice($("#msImage").attr("src").indexOf("/")+1);
		var thisPage=null;
		for (var i in GP_Images) {
			if (GP_Images[i].image==myImage) {
				thisPage={page: i, pageInf: GP_Images [i]};
				break;
			}
		}
		var winwidth=$("#msImage").width();
    	var factor=winwidth/thisPage.pageInf.full_x;
    	var arrayline=getArrayLine(line);
    	var spacePerLine=((thisPage.pageInf.frame_b-thisPage.pageInf.frame_t)/thisPage.pageInf.nlines)*factor;
    	$('#msLIneBox').css({'width': (GP_Images[GP[arrayline].page].frame_r-GP_Images[GP[arrayline].page].frame_l)*factor, 'height': spacePerLine*1.5});
  		$('#msLIneBox').css({top: (thisPage.pageInf.frame_t*factor), left: GP_Images[GP[arrayline].page].frame_l*factor});
		if ($('#Notes').is(':visible')) {
			if ($('#Glosses').is(':visible')) {
				$("#Glosses").css({height:($(window).height()/2)+10, backgroundSize: "300px "+(($(window).height()/2)+10)+"px"});
			}
			$("#Notes").height($(window).height()/2-30);
			$("#BodyText").height($(window).height()/2);
			activateBiblios();
		} else {
			if ($('#Glosses').is(':visible')) {
				$("#Glosses").css({height:$(window).height(), backgroundSize: "300px "+$(window).height()+"px"});
				$("#BodyText").height($(window).height());
			} else {
				$("#BodyText").height($(window).height());
			}
		}
		beforeResize.height=$(window).height();
		setUpArrows("image");
	}
	if ($(window).width()!=beforeResize.width) {
		var src=GP_Images[GP[arrayline].page].image;
		if ($('#Notes').is(':visible')) {
			var proportion=$(window).width()/6184;
			var bgpos= "-"+(91*proportion)+"px -"+(70*proportion)+"px";
			var bgpos2= "-"+(91*proportion)+"px -"+(280*proportion)+"px";
			var bgsize= ""+(6184*proportion)+"px "+(4377*proportion)+"px";
            //			$("#Notes").css({"background-position":bgpos2, "background-size":bgsize});
            //			$("#Buffer").css({"background-position":bgpos, "background-size":bgsize});
			inResizeWidth=true;
			activateBiblios();
			if ($('#Glosses').is(':visible')) {
				if ($(window).width()>700) {
					$("#Glosses").css({left:$(window).width()-301});
					$('#msImage').attr("width", $(window).width()-301);
					$('#msImage').attr("src", "msimages/"+src);
				} else { hideGloss();
					$('#msImage').attr("width", $(window).width());
					$('#msImage').attr("src", "msimages/"+src);
				}
			} else {
				$('#msImage').attr("width", $(window).width());
				$('#msImage').attr("src", "msimages/"+src);
			}
		} else {
			activateBiblios();
			$('#msImage').attr("width", $(window).width());
			$('#msImage').attr("src", "msimages/"+src);
			inResizeWidth=true;
			if ($('#Glosses').is(':visible')) {
				if ($(window).width()>700) {
					$("#Glosses").css({left:$(window).width()-301});
					$('#msImage').attr("width", $(window).width()-301);
					$('#msImage').attr("src", "msimages/"+src);
				} else { hideGloss();
					$('#msImage').attr("width", $(window).width());
					$('#msImage').attr("src", "msimages/"+src);
				}
			}
            if ($('#NotesGlossesBox').is(':visible')) {
                $("#NotesGlossesBox").css({marginLeft: ($('body').width()-540)/2});
                $("#NotesGlossesBox").css({marginRight: ($('body').width()-540)/2});
                $("#NotesGlosses").css({top: $("#NotesGlossesBox").height()});
                $("#NotesGlosses").css({width: $('body').width()});
            }
		}
	}
	$("body").height($(window).height());
	$("body").width($(window).width());
	if (inResizeWidth) {
		beforeResize.width=$(window).width();
	}
	activateBiblios();
}

function borderLine (thisline) {
	var arrayline=getArrayLine(thisline);
    $("p").css({'color':'black'})
    $("p[data-n='"+GP[arrayline].n+"']").css({'color': 'red'});
}

function createNTJLine (thisLine, view, skipGap) {
	var arrayline=getArrayLine(thisLine);
	var newp=$(document.createElement('p'));
	if (!skipGap && Gaps[GP[arrayline].n]!== undefined) {
		newp.addClass("PLine3");
		return newp;
	}
	newp.addClass("PLine");
	newp.attr('data-n', GP[arrayline].n);
	newp.attr('data-arrayn', thisLine);
	if (GP[arrayline].n%5===0) {
		if (view=="NT") newp.html('<span class="LineNo">'+GP[arrayline].n+"</span>"+GP[arrayline].NT);
		else if (view=="TJ") newp.html('<span class="LineNo">'+GP[arrayline].n+"</span>"+GP_TJ[arrayline].TJ);
	} else {
		if (view=="NT") newp.html(GP[arrayline].NT);
		else if (view=="TJ") newp.html(GP_TJ[arrayline].TJ);
	}
	return newp;
}

function disableNotesButtons() {
    return;
	$( "#Notes" ).off( "idle.idleTimer", function(event, elem, obj){
                      });
	$( "#Notes"  ).off( "active.idleTimer", function(event, elem, obj, triggerevent){
                       });
}

function enableNotesButtons() {
    return;
	$( "#Notes" ).on( "idle.idleTimer", function(event, elem, obj){
                     $("#footer").hide();
                     $("#Buttons").hide();
                     });
	$( "#Notes"  ).on( "active.idleTimer", function(event, elem, obj, triggerevent){
                      $("#footer").show();
                      $("#Buttons").show();
                      });
	$( "#Notes" ).idleTimer( {
                            timeout:1500,
                            events:'mousemove keydown wheel mousewheel mousedown touchstart touchmove MSPointerDown MSPointerMove'
                            });
}

function extractMSImage(thisline, target) {
	var arrayline=getArrayLine(thisline);
	if (thisline==0) {
		var bgPos= "-"+Math.round(GP_Images[GP[thisline].page].rubric_l/3)+"px -"+Math.round(GP_Images[GP[thisline].page].rubric_t/3)+"px";
		var bgSize = Math.round(GP_Images[GP[thisline].page].full_x/3)+"px "+Math.round(GP_Images[GP[thisline].page].full_y/3)+"px";
	} else {
		var nlines=GP_Images[GP[arrayline].page].nlines;
		var lineht=((GP_Images[GP[arrayline].page].frame_b-GP_Images[GP[arrayline].page].frame_t)/nlines);
		var nlines = thisline - GP_Images[GP[thisline].page].firstl;
		var offsettop = GP_Images[GP[thisline].page].frame_t+(nlines*lineht)-15;
		var bgPos = "-"+Math.round(GP_Images[GP[thisline].page].frame_l/2)+"px -"+Math.round(offsettop/2)+"px";
		var bgSize = Math.round(GP_Images[GP[thisline].page].full_x/2)+"px "+Math.round(GP_Images[GP[arrayline].page].full_y/2)+"px";
	}
    if (target=="NTTJ") {
        if (GP[arrayline].page!=currentPage) {
            $( "#PopImage").css ({background: "url('msimages/"+GP_Images[GP[arrayline].page].image+"')"})
            currentPage=GP[arrayline].page;
        }
        $( "#PopImage").css ({
            backgroundPosition: bgPos, backgroundSize: bgSize
        });
        $( "#PopImage").show();
    } else if (target=="NG") {
        if (GP[arrayline].page!=currentPage) {
            $( "#NGImage").css ({background: "url('msimages/"+GP_Images[GP[arrayline].page].image+"')"})
            currentPage=GP[arrayline].page;
        }
        $( "#NGImage").css ({
                             backgroundPosition: bgPos, backgroundSize: bgSize
                             });
        $( "#NGImage").show();
    }
}

function hideGloss () {
	var width=$("#BodyText").width();
	if (width>700) {
		$("#Image").animate({width: width});
		$("#msImage").attr("width", width);
		$("#Text").animate({width: width});
		$("#Glosses").animate({width: 0});
		$("#Glosses").css({backgroundSize: "0px 0px"});
		$("#Glosses").css({left: width});
        if ($("#Image").is(":visible")) {
        	var nRight=$(window).width()-64;
        	$('#imageRightArrow').css({left:nRight+"px"});
        } else {
        	var nRight=$(window).width()-64;
        	$('#textRightArrow').css({left:nRight+"px"});
        }

	} else {

	}
   	$("#glossIcn").attr("src", "inactive/icons-07.png");
    $('#glossIcn').parent().removeClass('ui-btn-emph');
   	$("#Glosses").hide();
   	$("#GlossCmd").attr("onclick", "showGloss()");
}

function hideNotes() {
	var arrayline=getArrayLine(line);
	if ($("#BodyText").height()<400) {
		disableNotesButtons();
	}
	var src=GP_Images[GP[arrayline].page].image;
	$("#Notes").animate({height: 0});
	$("#Notes").hide();
	$("#Buffer").hide();
	if (currView!="MS") adjustText($(window).height(), $("#BodyText").height());
	$("#BodyText").height($(window).height());
	$("#notesIcn").attr("src", "inactive/icons-05.png");
    $('#notesIcn').parent().removeClass('ui-btn-emph');
	$("#NotesCmd").attr("onclick", "showNotes()");
	if ($('#Glosses').is(':visible')) {
		$('#msImage').attr("width", $(window).width()-301);
		$('#msImage').attr("src", "msimages/"+src);
	} else {
		$('#msImage').attr("width", $(window).width());
		$('#msImage').attr("src", "msimages/"+src);
	}
	if ($("#Image").is(":visible")) {
		var nTop=($(window).height()-64)/2;
		$('#imageRightArrow').css({top:nTop+"px"});
		$('#imageLeftArrow').css({top:nTop+"px"});
	} else {
		var nTop=($(window).height()-64)/2;
		$('#textRightArrow').css({top:nTop+"px"});
		$('#textLeftArrow').css({top:nTop+"px"});
	}
}


function mobileMediaPlayer (){
    newmediaPlayer=null;
    if ( /Android/i.test(navigator.userAgent) ) {
        newmediaPlayer = new Media("/android_asset/www/audio/canterbury_prologue.amr");
    } else if ( /iPhone|iPad|iPod/i.test(navigator.userAgent) ) {
        newmediaPlayer = new Media("audio/canterbury_prologue.amr");
    }
    if (!newmediaPlayer) console.log("no media player");
    return newmediaPlayer;
}


function moveText () {
	if (audioPlaying) {
		line=$("input").val()-1;
        console.log("chose new line "+line);
        resumeAudio();
	}
	else {
		line=$("input").val();
		if (line==1) line=0;
	}
   	populateText(false);
}

function msToTime(duration) {
    var milliseconds = parseInt((duration%1000))
    , seconds = parseInt((duration/1000)%60)
    , minutes = parseInt((duration/(1000*60))%60)
    , hours = parseInt((duration/(1000*60*60))%24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
    var millstring=milliseconds.toString();
    if (millstring.length<2) millstring=millstring+"00";
    else if (millstring.length<3) millstring=millstring+"0";
    return hours + ":" + minutes + ":" + seconds + "." + millstring;
}

function timeToMS(duration) {
    var hours=duration.slice(0,2);
    var minutes=duration.slice(3,5);
    var seconds=duration.slice(6,12);
    var ms= (3600*parseInt(hours)+60*parseInt(minutes)+parseFloat(seconds));
 //   console.log("duration "+duration+"hours "+hours+" minutes "+minutes+" seconds "+seconds+" ms "+ms);
    return (3600*parseInt(hours)+60*parseInt(minutes)+parseFloat(seconds));
}

function notYet(){
    alert("Home and search views not yet implemented.")
}

function onDeviceReady(){
 //   console.log("CantApp ready 21");
    document.addEventListener("pause", onPause, false);
}

function onLoad() {
 //   console.log("CantApp ready 11");
//    console.log("gloss "+GP_Glosses['3']);
//    console.log("note "+GP_Notes['0']);
    mediaPlayer = null;
    document.addEventListener("deviceready", onDeviceReady, false);
    $( window ).on( "orientationchange", function( event ) {
                   console.log("switched orientation");
                   adjustViews();
                   });
    var deviceWidth = window.orientation == 0 ? window.screen.width : window.screen.height;
    // iOS returns available pixels, Android returns pixels / pixel ratio
    // http://www.quirksmode.org/blog/archives/2012/07/more_about_devi.html
    if (navigator.userAgent.indexOf('Android') >= 0 && window.devicePixelRatio) deviceWidth = deviceWidth / window.devicePixelRatio;
    var deviceHeight = window.orientation == 0 ? window.screen.height : window.screen.width;
    if (navigator.userAgent.indexOf('Android') >= 0 && window.devicePixelRatio) deviceHeight = deviceHeight / window.devicePixelRatio;
    if ((deviceWidth>=1024 && deviceHeight>=768) || (deviceHeight>=1024 && deviceWidth>=768))  isSmallScreen=false;
    else isSmallScreen=true;
    console.log("CantApp 31: device height "+deviceHeight+" device width "+deviceWidth+" small? "+isSmallScreen);
    if (isSmallScreen) setUpSmallScreen(); //set up small screen if small device
    adjustViews();
    if (!navigator.onLine) {
        //get the audio file: android app will only access mp3 files online, will not store and load local medi
        // specified by src on the audio element. So this will work fine
        $("#audioPlayer").attr("src", "audio/canterbury_prologue.amr")
    }
    $("#atogglemenus").removeClass("ui-btn ui-btn-left");
    audioPlayer = document.getElementById('audioPlayer');
 }


function onPause () {
    if (mediaPlayer) {
        mediaPlayer.release();
        mediaPlayer=null;
        audioPlaying=false;
    }
}

function pauseAudio() {
	$("#PAicn").attr("src", "images/playicn.png");
	$("#PACmd").attr("onclick", "resumeAudio()");
	audioPlaying=false;
//	if ( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) )  mediaPlayer.pause();
//	else
    audioPlayer.pause();
    showArrows();
}

function playAudio() {
    //	audioPlayer.src="audio/Maintry3.mp3";
    //	$("#Buttons").hide();
	$("#PAicn").attr("src", "images/pauseicn.png");
	$("#stopAudioLink").show();
    //   	$("#apAdjust").show();
	$("#PACmd").attr("onclick", "pauseAudio()");
	//get the line and start from there?
	var val = document.getElementById('slider0').value;
//	alert(val);
	line=val;
	if (line==1) line=0;
	setStartAudio();
	audioPlaying=true;
	updateCaptions();
//	if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
//        if (mediaPlayer==null) mediaPlayer=mobileMediaPlayer();
 //       mediaPlayer.play();
//	}
//	else
    audioPlayer.play();
    //hide the text arrows
    hideArrows();
}

function hideArrows() {
	$('#textLeftArrow').hide();
	$('#textRightArrow').hide();
	$('#imageLeftArrow').hide();
	$('#imageRightArrow').hide();
}

function showArrows() {
	$('#textLeftArrow').show();
	$('#textRightArrow').show();
	$('#imageLeftArrow').show();
	$('#imageRightArrow').show();
}

function populateText(override) {
	//figure out where we are on screen! what is being shown!
	var arrayline=getArrayLine(line);

	//also: check whether we are showing NT or TJ right now; repopulate if we are moving from one to other
    if (currView=="NT" || currView=="TJ") {
        var	start=parseInt(arrayline);
        if (GP[start]==undefined) {
            console.log("missing line in populate text "+start);
            return
        }
       var availableHeight=$('#BodyText').height()-3;
        //first scenario: may not need to replace the current view at all. If current line is in view, do nothing at all, and current view has not changed
        //so f: how many lines are visible?
        //so: is current line in view?
        //switching views: clean out
        var lineVisible=false;
        var nlines=$("[data-arrayn='"+start+"']").length;
        if (nlines>0) lineVisible=true;
        if ($('#TextNTJ p:first').attr("data-arrayn"))  {
            var firstLine= parseInt($('#TextNTJ p:first').attr("data-arrayn"));
        }
        else {
            var firstLine=line;
        }
        if ($('#Text').attr("data-view") != currView || !lineVisible) {
            $('#TextNTJ').children().remove();
            if (lineVisible) start=firstLine;
        } else {
            if (!override && lineVisible) return; //line in view, just return,  Override says: do the update anyway
        }
        if (override) $('#TextNTJ').children().remove();
        $('#Text').attr("data-view", currView);
        if (start==0) {
            if (currView=="NT")
                $('#TextNTJ').append('<h3 style="margin:0 0 10px 0; font-weight:bold">THE GENERAL PROLOGUE: Edited Text</h3>');
            else if (currView=="TJ")
                $('#TextNTJ').append('<h3 style="margin:0 0 10px 0; font-weight:bold">THE GENERAL PROLOGUE: Terry Jones\'s Minimal Translation</h3>');
        };
        if (GP[start]==undefined) console.log("error in populateText, for line "+start+" firstLine "+firstLine+" line "+line);
        var newline=GP[start].NT;
        var newp=$(document.createElement('p'));
        newp.addClass("PLine");
        newp.html(newline);
        $('#Text').hide();
        $('#TextNTJ').append(newp);
        var height = newp.actual('outerHeight', { includeMargin : true });
        newp.remove();
        if (currView!="MS") $('#Text').show();
        for (var i=0, lineno=start; lineno<GP.length && $('#TextNTJ').actual('height') + height +15< availableHeight; i++, lineno++) {
            newp=$(document.createElement('p'));
            newp.addClass("PLine");
            newp.attr('data-n', GP[lineno].n);
            newp.attr('data-arrayn', lineno);
            if (Gaps[GP[lineno].n]!== undefined) {
                var newp2=$(document.createElement('p'));
                newp2.addClass("PLine3");
                $('#TextNTJ').append(newp2);
            }
            if (GP[lineno].n%5===0) {
                if (currView=="NT") newp.html('<span class="LineNo">'+GP[lineno].n+"</span>"+GP[lineno].NT);
                else if (currView=="TJ") newp.html('<span class="LineNo">'+GP[lineno].n+"</span>"+GP_TJ[lineno].TJ);
            } else {
                if (currView=="NT") newp.html(GP[lineno].NT);
                else if (currView=="TJ") newp.html(GP_TJ[lineno].TJ);
            }
            $('#TextNTJ').append(newp);
        }
        //set the background for text or translation
        if (currView=="NT") {$('#BodyText').removeClass("TJBg").addClass("NTBg");$('body').removeClass("bodyTJ").addClass("bodyNT")};
        if (currView=="TJ") {$('#BodyText').removeClass("NTBg").addClass("TJBg");$('body').removeClass("bodyNT").addClass("bodyTJ")};

        if (audioPlaying) borderLine (line);
        //now: check the state of the msImage... do we need to replace it?
        if (GP_Images[GP[start].page].image!=$("#msImage").attr("src")) {
            $("#msImage").attr("src", "msimages/"+GP_Images[GP[start].page].image);
            //		$('#msImage').attr("width", $("#Image").width());
        }
    } else if (currView=="NG") {
        var bounds=getCurrentLines();
        getCombinedNG(bounds.firstLine, bounds.lastLine);
    } else if (currView=="MS") {
        //bring the right ms page into view
        showMSPage(line);
    }
    if ($('#Notes').is(':visible') || $('#Glosses').is(':visible')) showNotesGlossesText();
}

function progressBar (time) {
	var elapsedTime=time;
	var result = msToTime(elapsedTime*1000);
	var arrayline=getArrayLine(line);
    var nextline=parseInt(arrayline)+1;
//    console.log("ProgressBarTime "+time+" line "+arrayline+" start "+GP[arrayline].start+" end "+GP[nextline].start+" nextline "+nextline);
	if (result>=GP[arrayline].start && result<=GP[nextline].start) {}
	else {
       for (var i = 0; i < GP.length; i++) {
            if  (result>=GP[i].start && result<=GP[i+1].start) {
                line=GP[i].n;
                $("input").val(line).slider("refresh");
                updateCaptions(line);
                i=GP.length;
            }
        }
	}
}

function resumeAudio() {
    audioPlayer.play();
    hideArrows();
	/*	if ( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
            //			console.log("resuming play at line "+line);
            if (!mediaPlayer)  mediaPlayer=mobileMediaPlayer()
                mediaPlayer.play();
		}
		else audioPlayer.play(); */
		audioPlaying=true;
    setStartAudio();
	$("#PAicn").attr("src", "images/pauseicn.png");
	$("#PACmd").attr("onclick", "pauseAudio()");
}


//only called in ms view when audio is playing, or we move forward or back some way by the slider
function showPUText(thisline) {
	var arrayline=getArrayLine(thisline);
 	if (audioPlaying && thisline<parseInt(currAudioLine)) {
 //		console.log("in ShowPUText1 line "+thisline+" currline "+currAudioLine);
 		thisline+=2;
 		return;
 	};
    if (GP_TJ[arrayline]==undefined) {
    	console.log("TJ line undefined. Wierd. Line "+thisline);
    }
	$( "#TJPULine").html(GP_TJ[arrayline].TJ);
 	$( "#NTPULine").html(GP[arrayline].NT);
    // 	$( "#PopLine").html("<i style='font-size:90%'>Translation</i> "+GP_TJ[arrayline].TJ);
 	//calculate position...
 	if (line==0) {
 		var top=GP_Images[GP[arrayline].page].rubric_t+120;
 		var left=GP_Images[GP[arrayline].page].rubric_l
 	} else {
        showMSPage(thisline);
 		//have we changed the image..?
 		var nlines = GP_Images[GP[arrayline].page].nlines;
		var lineht=((GP_Images[GP[arrayline].page].frame_b-GP_Images[GP[arrayline].page].frame_t)/nlines);
		//thisline is using the CTP line number not the adjusted arrayline to calculate offset from top page
		//complication: when this line is 638-1 or 638-2
		if (thisline=="638-1" || thisline=="638-2") var plines=6;
		else var plines = thisline - GP_Images[GP[arrayline].page].firstl;
		var left=GP_Images[GP[arrayline].page].frame_l;
		var top=GP_Images[GP[arrayline].page].frame_t+(plines*lineht);
	}
	if (currView=="MS") $('#msLIneBox').show();
	var proportion=$("#msImage").width()/GP_Images[GP[arrayline].page].full_x;
    //calculate offset height, according to window size...
//    console.log("image height "+$("#msImage").height())
//    var offsetTop;
//	console.log("in ShowPUText line "+thisline+" currline "+currAudioLine+" proportion "+proportion+" msline top "+(GP_Images[GP[arrayline].page].frame_r-GP_Images[GP[arrayline].page].frame_l)*proportion);
	currAudioLine=thisline;

//	console.log("top "+top+" offset top "+offsetTop);
	$('#msLIneBox').css({'width': (GP_Images[GP[arrayline].page].frame_r-GP_Images[GP[arrayline].page].frame_l)*proportion});
	$('#msLIneBox').css({top: (top*proportion) - 8, left: (left*proportion)});
// place pu text according to where the box is in the page. Default is below
//	if ($("#msLIneBox").offset().top + $('#PUText').height() + 10 > $(window).height()) {
//		$('#PUText').offset({top: document.getElementById("msLIneBox").getBoundingClientRect().y-10-($('#PUText').height()*proportion)});
//	} else {
	     $('#PUText').offset({top: document.getElementById("msLIneBox").getBoundingClientRect().y + $('#msLIneBox').height() +10});
//	}
//	 	$('#PUText').css({top: (top*proportion)+offsetTop});
 	$('#PUText').show();
}

//called when audio ready to start
function setStartAudio() {
	var arrayline=getArrayLine(line);
	var startPlace = timeToMS(GP[arrayline].start)
/*    if ( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
        console.log("starting audio at line "+line+" "+Math.floor(startPlace*1000));
        mediaPlayer.seekTo(Math.floor(startPlace*1000));
    } else */
    audioPlayer.currentTime=startPlace;
}

function showGloss () {
	var width=$("#BodyText").width();
	if (width>700) {
		$("#Image").animate({width: width-301});
		$("#msImage").attr("width", width-301);
		$("#Text").animate({width: width-301});
		$("#Glosses").animate({width: 300});
		if ($('#Notes').is(':visible')) {
			$("#Glosses").css({left: width-301, backgroundSize: "300px "+($("#BodyText").height()+20)+"px"});
			$("#Glosses").height($("#BodyText").height()+50);
		} else {
			$("#Glosses").css({left: width-301, backgroundSize: "300px "+$("#BodyText").height()+"px"});
			$("#Glosses").height($("#BodyText").height());
		}
		$("#glossIcn").attr("src", "active/icons-active-07.png");
        $('#glossIcn').parent().addClass('ui-btn-emph');
		$("#Glosses").show();
		$("#GlossCmd").attr("onclick", "hideGloss()");
        showNotesGlossesText();
        if ($("#Image").is(":visible")) {
        	var nRight=$(window).width()-64-300;
        	$('#imageRightArrow').css({left:nRight+"px"});
        } else {
        	var nRight=$(window).width()-64-300;
        	$('#textRightArrow').css({left:nRight+"px"});
        }
         $("#Glosses").css({top: $("#BodyText").scrollTop()});
	} else {
        alert("not enough space for the gloss to display");
	}
}

//from http://stackoverflow.com/questions/123999/how-to-tell-if-a-dom-element-is-visible-in-the-current-viewport/7557433#7557433
function isElementInViewport (el) {
    //special bonus for those using jQuery
    var eap,
    rect     = el.getBoundingClientRect(),
    docEl    = document.documentElement,
    vWidth   = window.innerWidth || docEl.clientWidth,
    vHeight  = window.innerHeight || docEl.clientHeight,
    efp      = function (x, y) { return document.elementFromPoint(x, y) },
    contains = "contains" in el ? "contains" : "compareDocumentPosition",
    has      = contains == "contains" ? 1 : 0x14;

    // Return false if it's not in the viewport
    if (rect.right < 0 || rect.bottom < 0
        || rect.left > vWidth || rect.top > vHeight)
        return false;

    // Return true if any of its four corners are visible
    return (
            (eap = efp(rect.left,  rect.top)) == el || el[contains](eap) == has
            ||  (eap = efp(rect.right, rect.top)) == el || el[contains](eap) == has
            ||  (eap = efp(rect.right, rect.bottom)) == el || el[contains](eap) == has
            ||  (eap = efp(rect.left,  rect.bottom)) == el || el[contains](eap) == has
            );
}

function getArrayLine(thisline) {
	var arrayline;
	if (thisline=="IR")  arrayline=0;
	else if (thisline=="638-1") arrayline=639;
	else if (thisline=="638-2") arrayline=640;
	else if (thisline>638) arrayline=parseInt(thisline)+2;
	else  arrayline=thisline;
	return(arrayline);
}

function setUpSmallScreen() {
    $("#Buttons").removeClass("ui-grid-c");
    $("#Buttons").addClass("ui-grid-b");
    $("#buttonsb").hide();
    $("#combinedNGLink").show();
    $("#buttonsc").removeClass("ui-block-c");
    $("#buttonsc").addClass("ui-block-b");
    $("#buttonsc").css({width:"60%"});
    $("#buttonsa").css({width:"40%"});
    if ($(window).width()<500) {
        $(".buttons").css({height:"30px"});
    }
    if ($(window).width()>=500) {
        $(".buttons").css({height:"50px"});
    }
    //if we are currently looking at either notes or glosses -- switch to combined notes glosses view
    if ($('#Glosses').is(':visible') || $('#Notes').is(':visible')) {
        $('#Glosses').hide();
        $('#Notes').hide();
        showCombinedNG();
    }
}

function setUpBigScreen() {
    $("#combinedNGLink").hide();
    $("#Buttons").removeClass("ui-grid-b");
    $("#Buttons").addClass("ui-grid-c");
    $("#buttonsb").show();
    $("#buttonsc").removeClass("ui-block-b");
    $("#buttonsc").addClass("ui-block-c");
    $("#buttonsc").css({width:"40%"});
    $("#buttonsa").css({width:"30%"});
    if ($(window).width()>=500) {
        $(".buttons").css({height:"50px"});
    }
    if (currView=="NG") {
        showMS();
        showGloss();
        showNotes()
    }

}


function fillNotesGlosses(firstLine, lastLine) {
    if ($('#Notes').is(':visible')) {
    	activateBiblios();
        var thisLine=firstLine;
//        if (firstLine==37) {
 //           alert("pause");
//        }
        if ($("#NotesText").children().length==0) {
            while (thisLine<=lastLine) {
                if (GP_Notes[thisLine]!=undefined)  {
                    var newp=$(document.createElement('p'));
                    newp.attr('data-arrayn', thisLine);
                    newp.addClass("PLine3");
                    newp.html("<b>"+thisLine+".</b> "+GP_Notes[thisLine]);
                    $("#NotesText").append(newp);
                }
                thisLine+=1;
            }
        } else {
            var thisNote=$('#NotesText p:first');
            var thisNoteLine=parseInt(thisNote.attr("data-arrayn"));
            if (line<thisNoteLine) {
                $("#NotesText").children().remove(); //just send it around again!
                fillNotesGlosses(firstLine, lastLine);
                return;
            }
            while (thisNoteLine<firstLine && thisNote.length) {
                var nextNote=thisNote.next();
                if (nextNote.length) thisNoteLine=parseInt(nextNote.attr("data-arrayn"));
                thisNote.remove();
                thisNote=nextNote;
            }
            //catch situation: moved right past current note range, need to repopulate
            if (!thisNote.length && thisNoteLine<firstLine) {
                fillNotesGlosses(firstLine, lastLine);
                return;
            }
            while (thisNoteLine>=firstLine && thisNote.length && thisNoteLine<lastLine) {
                //just leave the line there
                var nextNote=thisNote.next();
                if (nextNote.length) thisNoteLine=parseInt(nextNote.attr("data-arrayn"));
                thisNote=nextNote;
                if (!thisNote.length) {
                    //no more notes here, but need to add
                    for (thisNoteLine+=1;thisNoteLine<=lastLine; thisNoteLine+=1) {
                        if (GP_Notes[thisNoteLine]!=undefined) {
                            var newp=$(document.createElement('p'));
                            newp.attr('data-arrayn', thisNoteLine);
                            newp.addClass("PLine3");
                            newp.html("<b>"+thisNoteLine+".</b> "+GP_Notes[thisNoteLine]);
                            $("#NotesText").append(newp);
                        }
                    }
                }
            }
            if (thisNote.length && thisNoteLine>lastLine) {
                while (thisNote.length) {
                    var nextNote=thisNote.next();
                    if (nextNote.length) thisNoteLine=parseInt(nextNote.attr("data-arrayn"));
                    thisNote.remove();
                    thisNote=nextNote;
                }
            }
        }
        //scroll to line, if it is not visible..
        var searchnline="#NotesText p[data-arrayn="+line+"]";
        var myNote=$(searchnline)[0];
        if (myNote!=undefined) {
            if (!isElementInViewport(myNote)) {
                $('#NotesText').animate({scrollTop: myNote.offsetTop-myNote.offsetHeight}, "slow");
            }
            $(".focusNote").removeClass("focusNote");
            $(searchnline).addClass("focusNote");
         }
    }
    if ($('#Glosses').is(':visible')) {
        var thisLine=firstLine;
        if ($("#GlossesText").children().length==0) {
            while (thisLine<=lastLine) {
                if (GP_Glosses[thisLine]!=undefined)  {
                    var newp=$(document.createElement('p'));
                    newp.attr('data-arrayn', thisLine);
                    newp.addClass("PLine3");
                    newp.html("<b>"+thisLine+".</b> "+GP_Glosses[thisLine]);
                    $("#GlossesText").append(newp);
                }
                thisLine+=1;
            }
        }  else {
            var thisNote=$('#GlossesText p:first');
            var thisNoteLine=parseInt(thisNote.attr("data-arrayn"));
            if (line<thisNoteLine) {
                $("#GlossesText").children().remove(); //just send it around again!
                fillNotesGlosses(firstLine, lastLine);
                return;
            }
            while (thisNoteLine<firstLine && thisNote.length) {
                var nextNote=thisNote.next();
                if (nextNote.length) thisNoteLine=parseInt(nextNote.attr("data-arrayn"));
                thisNote.remove();
                thisNote=nextNote;
            }
            //catch situation: moved right past current note range, need to repopulate
            if (!thisNote.length && thisNoteLine<firstLine) {
                fillNotesGlosses(firstLine, lastLine);
                return;
            }
            while (thisNoteLine>=firstLine && thisNote.length && thisNoteLine<lastLine) {
                //just leave the line there
                var nextNote=thisNote.next();
                if (nextNote.length) thisNoteLine=parseInt(nextNote.attr("data-arrayn"));
                thisNote=nextNote;
                if (!thisNote.length) {
                    //no more notes here, but need to add
                    for (thisNoteLine+=1;thisNoteLine<=lastLine; thisNoteLine+=1) {
                        if (GP_Glosses[thisNoteLine]!=undefined) {
                            var newp=$(document.createElement('p'));
                            newp.attr('data-arrayn', thisNoteLine);
                            newp.addClass("PLine3");
                            newp.html("<b>"+thisNoteLine+".</b> "+GP_Glosses[thisNoteLine]);
                            $("#GlossesText").append(newp);
                        }
                    }
                }
            }
            if (thisNote.length && thisNoteLine>lastLine) {
                while (thisNote.length) {
                    var nextNote=thisNote.next();
                    if (nextNote.length) thisNoteLine=parseInt(nextNote.attr("data-arrayn"));
                    thisNote.remove();
                    thisNote=nextNote;
                }
            }
            //scroll to line, if it is not visible..
            var searchnline="#GlossesText p[data-arrayn="+line+"]";
            var myNote=$(searchnline)[0];
            if (myNote!=undefined) {
                if (!isElementInViewport(myNote)) $('#GlossesText').animate({scrollTop: myNote.offsetTop-myNote.offsetHeight}, "slow");
                $(".focusNote").removeClass("focusNote");
                $(searchnline).addClass("focusNote");
            }
        }
    }
    activateBiblios();
}


function showMS () {
	var arrayline=getArrayLine(line);
    if (currView=="MS") {
 //       alert("Manuscript View now showing. Click on the Edited Text or Translation button to change view");
        return;
    }
    $('#msLIneBox').hide();
    currView="MS";
    $('#textviewicn').attr("src", "inactive/icons-08.png");
    $('#transviewicn').attr("src", "inactive/icons-inactive-trans.png");
    $('#combglnotesviewicn').attr("src", "inactive/icons-inactive-notesgl.png");
    $('#msviewicn').attr("src", "active/icons-active-MS.png");
    $('#textviewicn').parent().removeClass('ui-btn-emph');
    $('#combglnotesviewicn').parent().removeClass('ui-btn-emph');
    $('#msviewicn').parent().addClass('ui-btn-emph');
    $('#transviewicn').parent().removeClass('ui-btn-emph');

    $("#Text").hide();
    if ($("#Glosses").width()>0) {
        $('#msImage').attr("width", $('body').width()-$("#Glosses").width());
        $('Image').attr("width", $('body').width()-$("#Glosses").width());
    } else {
        $('#msImage').attr("width", $('body').width());
        $('Image').attr("width", $('body').width());
        $("#Glosses").hide();
    }
    $('#msImage').attr("src", "msimages/"+GP_Images[GP[arrayline].page].image);
    $("#Image").show();
    $("#BodyText").show();
    $("#NotesGlosses").hide();
    $("#NotesGlossesBox").hide();
    updateCaptions();
    //where do we put those arrows?
    setUpArrows("image");
    $('#Glosses').css({'top':0, 'left':$("#Text").width(),'position': 'absolute', 'z-index': 500});
    $("#BodyText").css({'overflow-y':'scroll'});
}

function showMSPage(thisline) {
	var arrayline=getArrayLine(thisline);
    if (GP_Images[GP[arrayline].page].image!=$("#msImage").attr("src")) {
        $("#msImage").attr("src", "msimages/"+GP_Images[GP[arrayline].page].image);
        // 			$('#msImage').attr("width", $("#Image").width());
    }
}
function showTrans () {
    if (currView=="TJ") {
   //     alert("Translation View now showing. Click on the Edited Text or Manuscript button to change view");
        return;
    }
    $('#msLIneBox').hide();
    currView="TJ";
    populateText(false);
    $('#textviewicn').attr("src", "inactive/icons-08.png");
    $('#transviewicn').attr("src", "active/icons-Trans-active.png");
    $('#msviewicn').attr("src", "inactive/icons-inactive-MS.png");
    $('#combglnotesviewicn').attr("src", "inactive/icons-inactive-notesgl.png");
    $('#Image').hide();
    $('#Text').show();
    $('#NotesGlosses').hide();
    $('#NotesGlossesBox').hide();
    updateCaptions();
    $('#textviewicn').parent().removeClass('ui-btn-emph');
    $('#msviewicn').parent().removeClass('ui-btn-emph');
    $('#combglnotesviewicn').parent().removeClass('ui-btn-emph');
    $('#transviewicn').parent().addClass('ui-btn-emph');
    $('#Glosses').css({'top':0, 'left':$("#Text").width(),'position': 'absolute', 'z-index': 500});
//    $("#BodyText").css({'overflow-y':'hidden'});
    $('#BodyText').show();
    setUpArrows("text");
}

function showText () {
    if (currView=="NT") {
 //       alert("Edited Text View now showing. Click on the Translation or Manuscript button to change view");
        return;
    }
    $('#msLIneBox').hide();
    currView="NT";
    var origLine=line;
    populateText(false);
    $('#textviewicn').attr("src", "active/icons-active-08.png");
    $('#transviewicn').attr("src", "inactive/icons-inactive-trans.png");
    $('#msviewicn').attr("src", "inactive/icons-inactive-MS.png");
    $('#combglnotesviewicn').attr("src", "inactive/icons-inactive-notesgl.png");
    $('#Image').hide();
    $('#NotesGlosses').hide();
    $('#textviewicn').parent().addClass('ui-btn-emph');
    $('#combglnotesviewicn').parent().removeClass('ui-btn-emph');
    $('#msviewicn').parent().removeClass('ui-btn-emph');
    $('#transviewicn').parent().removeClass('ui-btn-emph');
    $('#Text').show();
    $('#BodyText').show();
    $('#NotesGlosses').hide();
    $('#NotesGlossesBox').hide();
    $('#Image').hide();
    setUpArrows("text");
    updateCaptions();
}

function getCurrentLines(){
    if ($('#Notes').is(':visible') || $('#Glosses').is(':visible') ) {
        //get first line present in text and last line
        if (currView=="MS") {
			//calculate last visible line...
			var myImage = $("#msImage").attr("src").slice($("#msImage").attr("src").indexOf("/")+1);
			for (var i in GP_Images) {
				if (GP_Images[i].image==myImage) {
					thisPage={page: i, pageInf: GP_Images [i]};
					break;
				}
    		}
    		var winheight=$(window).height();
    		var winwidth=$(window).width();
    		var factor=winwidth/thisPage.pageInf.full_x;
 			var scrolltop=$("#BodyText").scrollTop();
    		if ($("#Glosses").is(":visible")) winwidth-=300;
    		if ($("#Notes").is(":visible")) winheight=winheight/2;
    		var firstLine=line;
    		var topFrameSize=thisPage.pageInf.frame_t*factor;
    		var bottomFrameStart=thisPage.pageInf.frame_b*factor;
    		var spacePerLine=((thisPage.pageInf.frame_b-thisPage.pageInf.frame_t)/thisPage.pageInf.nlines)*factor;
    		var linesAvailable=Math.floor(winheight/spacePerLine);
    		//ok. three possibilities: first line is first line of page. In that case, top margin might take up some lines
    		if (line==thisPage.pageInf.firstl) {
    			if (scrolltop<topFrameSize) {
    				linesAvailable-=Math.floor((topFrameSize-scrolltop)/spacePerLine)-3;
    				if (linesAvailable<0) linesAvailable=0;
    			}
    		}
    		var lastline=line+linesAvailable+2;
    		if (lastline>thisPage.pageInf.firstl+thisPage.pageInf.nlines-1)
    			lastline=thisPage.pageInf.firstl+thisPage.pageInf.nlines-1;
            return {
                //to do: work out better algorithm to figure which lines are in view
                //crap! first line will be first line. Last line is also set up properly now
                  firstLine: line, lastLine: lastline}
        }
        else {
            if ($('#TextNTJ p:first').attr("data-arrayn")) {
                var firstLine= parseInt($('#TextNTJ p:first').attr("data-arrayn"));
            } else {
                var nextLine=$('#TextNTJ p:first').next();
                while (!nextLine.attr("data-arrayn")) nextLine=nextLine.next();
                var firstLine= parseInt(nextLine.attr("data-arrayn"));
            }
            if ($('#TextNTJ p:last').attr("data-arrayn")) {
                var lastLine= parseInt($('#TextNTJ p:last').attr("data-arrayn"));
            } else {
                var prevLine=$('#TextNTJ p:first').prev();
                while (!prevLine.attr("data-arrayn")) prevLine=prevLine.prev();
                var lastLine= parseInt(prevLine.attr("data-arrayn"));
            }
        }
        return {firstLine:firstLine, lastLine:lastLine};
    } else {
        var msFirstLine=parseInt(line);
        if (msFirstLine<5) msFirstLine=1;
        else msFirstLine-=5;
        return {firstLine: msFirstLine, lastLine: parseInt(line)+15}
    }
}

function showCombinedNG() {
    if (currView=="NG") return;
    currView="NG";
    $('#textviewicn').parent().removeClass('ui-btn-emph');
    $('#combglnotesviewicn').parent().addClass('ui-btn-emph');
    $('#msviewicn').parent().removeClass('ui-btn-emph');
    $('#transviewicn').parent().removeClass('ui-btn-emph');
    $('#textviewicn').attr("src", "inactive/icons-08.png");
    $('#transviewicn').attr("src", "inactive/icons-inactive-trans.png");
    $('#msviewicn').attr("src", "inactive/icons-inactive-MS.png");
    $('#combglnotesviewicn').attr("src", "active/icons-active-notesgl.png");
    if (audioPlaying) $('#NotesGlossesText').height($('body').height()-$('#NotesGlossesBox').height());
    else $('#NotesGlossesText').height($('body').height());
    $('#Image').hide();
    $('#Text').hide();
    var bounds=getCurrentLines();
    getCombinedNG(bounds.firstLine, bounds.lastLine);
}

function getCombinedNG(firstLine, lastLine){
    $("#Image").hide();
    $("#Glosses").hide();
    $("#Notes").hide();
    $("#Text").hide();
    var thisLine=firstLine;
    if ($("#NotesGlossesText").children().length==0) {
        while (thisLine<=lastLine) {
            if (GP_Glosses[thisLine]!=undefined)  {
                var newp=$(document.createElement('p'));
                newp.attr('data-arrayn', thisLine);
                newp.addClass("PLine3");
                newp.html("<b>"+thisLine+".</b> "+GP_Glosses[thisLine]);
                $("#NotesGlossesText").append(newp);
            }
           if (GP_Notes[thisLine]!=undefined)  {
                var newp=$(document.createElement('p'));
                newp.attr('data-arrayn', thisLine);
                newp.addClass("PLine3");
                newp.html("<b>"+thisLine+".</b> "+GP_Notes[thisLine]);
                $("#NotesGlossesText").append(newp);
            }
            thisLine+=1;
        }
        activateBiblios();
    } else {
        var thisNote=$('#NotesGlossesText p:first');
        var thisNoteLine=parseInt(thisNote.attr("data-arrayn"));
        if (line<thisNoteLine) {
            $("#NotesGlossesText").children().remove(); //just send it around again!
            getCombinedNG(firstLine, lastLine);
            return;
        }
        while (thisNoteLine<firstLine && thisNote.length) {
            var nextNote=thisNote.next();
            if (nextNote.length) thisNoteLine=parseInt(nextNote.attr("data-arrayn"));
            thisNote.remove();
            thisNote=nextNote;
        }
        //catch situation: moved right past current note range, need to repopulate
        if (!thisNote.length && thisNoteLine<firstLine) {
            getCombinedNG(firstLine, lastLine);
            return;
        }
        while (thisNoteLine>=firstLine && thisNote.length && thisNoteLine<lastLine) {
            //just leave the line there
            var nextNote=thisNote.next();
            if (nextNote.length) thisNoteLine=parseInt(nextNote.attr("data-arrayn"));
            thisNote=nextNote;
            if (!thisNote.length) {
                //no more notes here, but need to add
                for (thisNoteLine+=1;thisNoteLine<=lastLine; thisNoteLine+=1) {
                    if (GP_Glosses[thisNoteLine]!=undefined) {
                        var newp=$(document.createElement('p'));
                        newp.attr('data-arrayn', thisNoteLine);
                        newp.addClass("PLine3");
                        newp.html("<b>"+thisNoteLine+".</b> "+GP_Glosses[thisNoteLine]);
                        $("#NotesGlossesText").append(newp);
                    }
                    if (GP_Notes[thisNoteLine]!=undefined) {
                        var newp=$(document.createElement('p'));
                        newp.attr('data-arrayn', thisNoteLine);
                        newp.addClass("PLine3");
                        newp.html("<b>"+thisNoteLine+".</b> "+GP_Notes[thisNoteLine]);
                        $("#NotesGlossesText").append(newp);
                    }
                }
            }
        }
        if (thisNote.length && thisNoteLine>lastLine) {
            while (thisNote.length) {
                var nextNote=thisNote.next();
                if (nextNote.length) thisNoteLine=parseInt(nextNote.attr("data-arrayn"));
                thisNote.remove();
                thisNote=nextNote;
            }
        }
    }
    //scroll to line, if it is not visible..
    var searchnline="#NotesGlossesText p[data-arrayn="+line+"]";
    var myNote=$(searchnline)[0];
    if (myNote!=undefined) {
        if (!isElementInViewport(myNote)) {
             $('#NotesGlossesText').animate({scrollTop: myNote.offsetTop-myNote.offsetHeight}, "slow");
 //            myNote.scrollIntoView();
        }
        $(".focusNote").removeClass("focusNote");
        $(searchnline).addClass("focusNote");
    }
    $("#BodyText").hide();
    $("#NotesGlosses").show();
    if (audioPlaying) $("#NotesGlossesBox").show();
    else $("#NotesGlossesBox").hide();
    activateBiblios();
}

function showNotesGlossesText() {
    var bounds= getCurrentLines();
    fillNotesGlosses(bounds.firstLine, bounds.lastLine);
 }

function showNotes() {
    //	$("#Notes").height($("#BodyText").height()/2-30);
    // if we are on a mobile or similar platform: allow notes to take over whole window -- now only called when window is large enough

    $("#Notes").animate({height: $("#BodyText").height()/2-30}, "slow");
    adjustText(($("#BodyText").height()/2)+10, $("#BodyText").height());
    $("#BodyText").height($("#BodyText").height()/2);
    $("#Buffer").show();
    $("#Notes").show();
    var proportion=$("#BodyText").width()/6184;
    var bgpos= "-"+(91*proportion)+"px -"+(70*proportion)+"px";
    var bgpos2= "-"+(91*proportion)+"px -"+(280*proportion)+"px";
    var bgsize= ""+(6184*proportion)+"px "+(4377*proportion)+"px";
    //	$("#Notes").css({"background-position":bgpos2});
    //	$("#Notes").css({"background-size":bgsize});
    $("#Buffer").css({"background-position":bgpos});
    $("#Buffer").css({"background-size":bgsize});
    if ($('#Glosses').is(':visible')) {
        $("#Glosses").css({height:($(window).height()/2)+10});
    }
    if ($('#Notes').is(':visible') || $('#Glosses').is(':visible')) showNotesGlossesText();
    $("#notesIcn").attr("src", "active/icons-active-05.png");
    $('#notesIcn').parent().addClass('ui-btn-emph');
    $("#NotesCmd").attr("onclick", "hideNotes()");
    if ($("#Image").is(":visible")) {
		var nTop=$(window).height()/4-32;
		$('#imageRightArrow').css({top:$("#BodyText").scrollTop()+nTop+"px"});
		$('#imageLeftArrow').css({top:$("#BodyText").scrollTop()+nTop+"px"});
	} else {
		var nTop=$(window).height()/4-32;
		$('#textRightArrow').css({top:nTop+"px"});
		$('#textLeftArrow').css({top:nTop+"px"});
	}
    activateBiblios();
}

function activateBiblios() {
	$(".biblio").on('mouseover', function() {
		 var dref=$(this).attr("data-ref");
		 var $biblioref = $("#biblioref").show();
			var pos = $.PositionCalculator( {
			target: this,
			targetAt: "top right",
			item: $biblioref,
			stick: "all",
			itemAt: "top left",
			flip: "both"
		}).calculate();
			$biblioref.html(biblio[dref]);
		$biblioref.css({
			top: parseInt($biblioref.css('top')) + pos.moveBy.y + "px",
			left: parseInt($biblioref.css('left')) + pos.moveBy.x + "px"
		});
	});
	$(".biblio").click(function() {
		$("#biblioref").hide();
	});
	$("#Notes").click(function() {
		if ($('#biblioref:hover').length == 0) {
			$("#biblioref").hide();
		}
	});
	$("#NotesGlosses").click(function() {
		if ($('#biblioref:hover').length == 0) {
			$("#biblioref").hide();
		}
	});
	$("#TextNTJ").click(function() {
			$("#biblioref").hide();
	});
	$("#Image").click(function() {
			$("#biblioref").hide();
	});
}

function stopAudio() {
/*	if ( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
        mediaPlayer.stop();
        mediaPlayer.release();
        mediaPlayer=null;
	}
	else */
    audioPlayer.pause();
    showArrows();
	$("#msLIneBox").hide();
	$( "#LineInf" ).hide();
	$('#PUText').hide();
	$("p").css({'color':'black'});
	audioPlaying=false;
	$("#PAicn").attr("src", "images/playicn.png");
	$("#PACmd").attr("onclick", "playAudio()");
	$("#stopAudioLink").hide();
    //   	$("#apAdjust").hide();

}

function calculateLineHeight() {
	if ($("#Image").is(":visible")) {
		//figure out where we are and what we are going to show...
		//which image?
		var myImage = $("#msImage").attr("src").slice($("#msImage").attr("src").indexOf("/")+1);
		var thisPage={};
		for (var i in GP_Images) {
			if (GP_Images[i].image==myImage) {
    			thisPage={page: i, pageInf: GP_Images [i]};
    			break;
     		}
     	}
 	}
	var winheight=$(window).height();
	var winwidth=$(window).width();
	var scrolltop=$("#BodyText").scrollTop();
	if ($("#Glosses").is(":visible")) winwidth-=300;
	if ($("#Notes").is(":visible")) winheight=winheight/2;
	var factor=winwidth/thisPage.pageInf.full_x;
	var topFrameSize=thisPage.pageInf.frame_t*factor;
    var bottomFrameStart=thisPage.pageInf.frame_b*factor;
    return({spacePerLine:((thisPage.pageInf.frame_b-thisPage.pageInf.frame_t)/thisPage.pageInf.nlines)*factor, topFrameSize: topFrameSize, bottomFrameStart: bottomFrameStart});
}

function updateCaptions() {
	var arrayline=getArrayLine(line);
	//set up position for text view; ms view; write in caption texts; move captions in div or over image so they are viewable
	//do we need to move the text up? in text view...
	if (currView=="NT" || currView=="TJ") {
        if (GP[arrayline]==undefined) {
            console.log("missing line"+line);
        }
		var position = $("p[data-n='"+GP[arrayline].n+"']").position();
		var position2 = $("p[data-n='"+GP[arrayline].n+"']").offset();
        var voffset=($("#BodyText").width()-300)/10 - 35;
		if (audioPlaying ) {
			borderLine(line);
			var posFoot = $("#BodyText").height()-20;
			if ($('#Notes').is(':visible')) {var limit=130} else {var limit=200}
            if (position==undefined) {
       //         pauseAudio();
                console.log("missing line here "+line);
                return;
            }
			if (position.top+limit>posFoot) {
				populateText(true);
				position = $("p[data-n='"+GP[arrayline].n+"']").position();
			}
		}
        if ($( "#LineInf" ).is(':visible')) $('#LineInf').animate({top: position.top-voffset, left: position.left-50}, "slow");
		if (audioPlaying ) {
            $( "#LineInf" ).show();
            extractMSImage(line, "NTTJ");
      //      $( "#PopLine").html("<i style='font-size:90%'>Edited Text</i> "+GP[arrayline].NT);
            $( "#PopLine").removeClass("bodyTJ").addClass("bodyNT");
			if (currView=="NT") {
                $( "#PopLine").html(GP_TJ[arrayline].TJ);
                $( "#PopLine").removeClass("bodyNT").addClass("bodyTJ");
            } else if (currView=="TJ") {
                $( "#PopLine").html(GP[arrayline].NT);
                $( "#PopLine").removeClass("bodyTJ").addClass("bodyNT");
            }
        }
    }  else if (currView=="MS"){
		showPUText(line);
		if (audioPlaying) {
//			console.log("im PU text "+line+"position "+position+" position2 "+position2);
			var position = $("#msLIneBox").offset();
			var position2 = $("#PUText").position();
			var posFoot = $("#BodyText").height()-20;
			var lineHeight=calculateLineHeight().spacePerLine;
      var spaceReq=$('#msLIneBox').height()+$("#PUText").height()+15;
 //           console.log("where am I");
			if (position.top+spaceReq>posFoot) {
        //when we get to the bottom of the page...
				console.log("top of PUText box "+position.top+" window height "+ $(window).height()+" body height "+posFoot+" space per line "+lineHeight);
        $('#BodyText').animate({scrollTop: position.top-lineHeight}, "slow");
                //	   $('#Gloss').css({'position':'relative'});
        $('#Glosses').animate({top: position2.top}, "slow");
			}
			$('#LineInf').hide();
		} else {
           $('#LineInf').hide();
           $('#PUText').hide();
            $('#msLIneBox').hide();
        }
	} else if (currView=="NG") {
        var bounds=getCurrentLines();
        getCombinedNG(bounds.firstLine, bounds.lastLine);
        if (audioPlaying) {
            $("#NotesGlossesBox").show();
            $("#NotesGlossesBox").css({marginLeft: ($('body').width()-540)/2});
            $("#NotesGlossesBox").css({marginRight: ($('body').width()-540)/2});
            extractMSImage(line, "NG");
            $( "#NGLineNT").html(GP[arrayline].NT);
            $( "#NGLineTJ").html(GP_TJ[arrayline].TJ);
            $("#NotesGlosses").css({top: $("#NotesGlossesBox").height()+8});
            $("#NotesGlossesText").height($('body').height()-$("#NotesGlossesBox").height()-8);
            $("#NotesGlosses").css({width: $('body').width()});
        } else {
            $("#NotesGlossesBox").hide();
            $("#NotesGlossesText").height($('body').height());
            $("#NotesGlosses").css({width: $('body').width()});
        }
    }
    if ($('#Notes').is(':visible') || $('#Glosses').is(':visible')) showNotesGlossesText();
}

//call when the window could be large enough, but has been resized too small
function windowNeedsEnlarging () {
    if (($(window).height()>=1024 && $(window).width()>=768) || ($(window).height()>=768 && $(window).width()>=1024)) {
        isSmallWindow=false;
        console.log("Window big enough")
        return false;
    }
    isSmallWindow=true;
    console.log("Window not big enough")
    return true;
}
