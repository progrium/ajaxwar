if( typeof AjaxWar == 'undefined' ) {
    AjaxWar = {};
} else {
    throw "Ajaxwar was already defined.  Someone probably did bad copy/pasting.";
}

AjaxWar._objRefIds = [];
AjaxWar._objRefs = {};

AjaxWar.getNextRef = function () {
    return 'ajxwr_' + AjaxWar._objRefIds.length;
}

AjaxWar.addRef = function (id, ref) {
    AjaxWar._objRefIds.push(id);
    AjaxWar._objRefs[id] = ref;
}

AjaxWar.killRef = function(id) {
    for(var i=0; i<AjaxWar._objRefIds.length; i++) {
        if( AjaxWar._objRefIds[i] === id ) {
            AjaxWar._objRefIds.splice(i,1);
            break;
        }
    }
    
    delete AjaxWar._objRefs[id];
}

AjaxWar.getUnitById = function(id) {
    return AjaxWar._objRefs[id];
}

//////// SVG STUFF
AjaxWar.svg = {};
AjaxWar.svg._canvas = false;
AjaxWar.svg.init = function() {
    var playfieldId = AjaxWar.playfieldId;
    
    var node = document.getElementById(playfieldId);
    var width = $('#'+playfieldId).width();
    var height = $('#'+playfieldId).height();
    
    AjaxWar.svg._canvas = Raphael(node, width, height);
}

AjaxWar.svg.makeCircle = function(x,y,r, color) {
    var circle = AjaxWar.svg._canvas.circle(x,y,r);
    circle.attr("stroke", color);
    return circle;
}

//////// Unit Class
AjaxWar.Unit = function(id, unittype, x, y, color) {
    this.id = id;
    this.type = unittype;
    this.x = x;
    this.y = y;
    
    var div = $("<div>").html("");
    div.addClass(unittype);
    div.css( 'left', x + 'px' );
    div.css( 'top', y + 'px' );
    
    // Temporary way to show color??
    div.css('border', '4px solid #'+((color)?color:AjaxWar.playerColor));
    
    div.attr('id', id);
    AjaxWar.addRef(id, this); 
    
    if( unittype === 'tank' ) {
        div.draggable({
            start: function(evt, ui) {
                AjaxWar.ui.dragTank(id, evt, ui);
            },
            stop: function(evt, ui) {
                AjaxWar.ui.dropTank(id, evt, ui);
            }
        });
        
        div.css('position', 'absolute'); // no, jquery, I don't want draggable things to always be relative.
    }
    
    if( unittype === 'tank' || unittype === 'tower' ) {
        this.rangeCircle = AjaxWar.svg.makeCircle(x,y,this.range, this.radiusColor );
    }
    
    $("#"+AjaxWar.playfieldId).prepend(div);
    
    $('#'+id).click(function(e) {
        AjaxWar.ui.clickUnit(id);
        return false;
    });
    
    AjaxWar.util.log('created unit #'+id+' ('+unittype+')');
    
    this.div = div;
}

AjaxWar.Unit.prototype = {
    radiusColor : '#F00', 
    range : 50, //range, in pixels
    speed : 50, //pixels per second
    
    calculateTimeToDestination : function(x, y) {
        var x = Math.pow((this.x - x), 2);
        var y = Math.pow((this.y - y), 2);
        var d = Math.sqrt(x+y);
        return (d / this.speed) * 1000;
    },
    
    move : function(x, y) {
      var animTime = this.calculateTimeToDestination(x, y);
      var tank = this;
      this.div.animate({ 
          left: x,
          top: y,
          }, {
              duration : animTime,
              step :  function(evt,obj) { 
                  tank.x = tank.div.position().left;
                  tank.y = tank.div.position().top;

                  //AjaxWar.util.log(myTank.x+','+myTank.y);

                  tank.rangeCircle.animate({cx:tank.x, cy:tank.y}, 0)
              }
          } 
      );
    }
};
//////// End Unit Class

AjaxWar.util = {};
AjaxWar.ui = {};

AjaxWar.util.relPosition = function (element, mouseX, mouseY) {
    var offset = $(element).offset();
    var x = mouseX - offset.left;
    var y = mouseY - offset.top;
    
    return {'x': parseInt(x), 'y': parseInt(y)};
}

AjaxWar.util.inArray = function (haystack, needle) {
    if( haystack.length ) {
        for (var i=0; i < haystack.length; i++) {
            if (haystack[i] === needle) {
                 return true;
            }
        }
    } else {
        for( var i in haystack ) {
            if (haystack[i] === needle) {
                 return true;
            }                    
        }
    }
    return false;
};

AjaxWar.util.count = function( obj ) {
    var count = 0;
    for( var k in obj ) {
        if( obj.hasOwnProperty(k) ) {
           ++count;
        }
    }
    
    return count;
}

AjaxWar.util.log = function(msg) {
    //$('#message_queue').val( msg + "\n" + $('#message_queue').val() );
    log(msg); // see util.js
}

AjaxWar.ui.clickUnit = function(id) {
    AjaxWar.util.log('CLICKED UNIT ' + id);
}

AjaxWar.ui.indicator = {};
AjaxWar.ui.indicator.clearIndicator = function() {
    $('#tank_indicator').css('border', 'solid 4px white');
    $('#production_indicator').css('border', 'solid 4px white');
    $('#tower_indicator').css('border', 'solid 4px white');
}

AjaxWar.ui.indicator.cursor_idx = 0;
AjaxWar.ui.indicator.cursor = 'not_a_unit';
AjaxWar.ui.indicator.keyMappings = {
    1 : 'tank',
    2 : 'production',
    3 : 'tower'
};
AjaxWar.ui.indicator.isValid = function() {
    return AjaxWar.util.inArray(AjaxWar.ui.indicator.keyMappings, AjaxWar.ui.indicator.cursor);
}

AjaxWar.ui.updateSelector = function(key) {
    var map = AjaxWar.ui.indicator.keyMappings[key];
    
    if( map ) {
        AjaxWar.ui.indicator.clearIndicator();
        
        $('#'+map+'_indicator').css('border', 'solid 4px red');
        AjaxWar.ui.indicator.cursor_idx = +key;
        AjaxWar.ui.indicator.cursor = map;
    }            
}

AjaxWar.ui.updateSelector(1);

AjaxWar.ui._ghost = false; //lazy grue is lazy
AjaxWar.ui._ghostBuster = function() {
    if(AjaxWar.ui._ghost) {
        var id = AjaxWar.ui._ghost.id;
        $( '#' + id ).remove();
        AjaxWar.killRef(id);
    }
    
    AjaxWar.ui._ghost = false;
}

AjaxWar.ui.dragTank = function(id, evt, ui) {
    AjaxWar.util.log( 'startTankMove: ' + id );
    AjaxWar.ui._ghostBuster();
    
    var myTank = AjaxWar.getUnitById(id);
    var ghost = new AjaxWar.Unit(id+'-movement_ghost', 'ghosttank', myTank.x, myTank.y);
    
    ghost.div.css( 'opacity', '.5' );
    AjaxWar.ui._ghost = ghost;
}

AjaxWar.ui.dropTank = function(id, evt, ui) {
    AjaxWar.util.log( 'endTankMove: ' + id );
    AjaxWar.ui._ghostBuster();
    
    var myTank = AjaxWar.getUnitById(id);
    
    myTank.div.css( 'left', myTank.x + 'px' );
    myTank.div.css( 'top', myTank.y + 'px' );
    
    endPos = AjaxWar.util.relPosition("#"+AjaxWar.playfieldId, evt.pageX, evt.pageY);
    
    myTank.move(endPos.x, endPos.y);
}

AjaxWar.init = function(playfieldId, color) {
    AjaxWar.playfieldId = playfieldId;
    AjaxWar.playerColor = color;
    
    $(document).keypress(function (eh){
        var key = parseInt(String.fromCharCode(eh.charCode));
        AjaxWar.ui.updateSelector(key);
    });
    
    $('#'+AjaxWar.playfieldId).click(function(e){
        if( !AjaxWar.ui.indicator.isValid() ) {
            return;
        }
    
        var id = AjaxWar.getNextRef();
        var unitType = AjaxWar.ui.indicator.cursor;
        mousePos = AjaxWar.util.relPosition("#"+AjaxWar.playfieldId, e.pageX, e.pageY);
    
        var unit = new AjaxWar.Unit(id, unitType, mousePos.x, mousePos.y);
    
        return false;
    });
    
    $(document).bind('contextmenu', function(e) {
    
        AjaxWar.ui.indicator.cursor_idx
    
        AjaxWar.ui.indicator.cursor_idx++;
    
        if( AjaxWar.ui.indicator.cursor_idx > AjaxWar.util.count(AjaxWar.ui.indicator.keyMappings) ) {
            AjaxWar.ui.indicator.cursor_idx = 1;
        }
    
        AjaxWar.ui.updateSelector(AjaxWar.ui.indicator.cursor_idx);
    
        return false;
    });
    
    AjaxWar.svg.init();
    
    AjaxWar.util.log('ajaxwar initialized');
    
}