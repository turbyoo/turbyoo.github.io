function fontMetrics( font, pixel_size, more_line_gap = 0.0 ) {
    var cap_scale   = pixel_size / font.cap_height;
    var low_scale   = Math.round( font.x_height * cap_scale ) / font.x_height;
    

    var ascent      = Math.round( font.ascent * cap_scale );
    
    var line_height = Math.round( cap_scale * ( font.ascent + font.descent + font.line_gap ) + more_line_gap );
    
    return { cap_scale   : cap_scale,
             low_scale   : low_scale,
             pixel_size  : pixel_size,
             ascent      : ascent,
             line_height : line_height
           };
}


function charRect( pos, font, font_metrics, font_char, kern = 0.0 ) {

    var lowcase = ( font_char.flags & 1 ) == 1;


    var baseline = pos[1] - font_metrics.ascent;


    var scale = lowcase ? font_metrics.low_scale : font_metrics.cap_scale;


    var g      = font_char.rect;
    var bottom = baseline - scale * ( font.descent + font.iy );
    var top    = bottom   + scale * ( font.row_height );
    var left   = pos[0]   + font.aspect * scale * ( font_char.bearing_x + kern - font.ix );
    var right  = left     + font.aspect * scale * ( g[2] - g[0] );
    var p = [ left, top, right, bottom ];


    var new_pos_x = pos[0] + font.aspect * scale * ( font_char.advance_x + kern );



    var vertices = [
        p[0], p[1],  g[0], g[1],  scale,
        p[2], p[1],  g[2], g[1],  scale,
        p[0], p[3],  g[0], g[3],  scale,

        p[0], p[3],  g[0], g[3],  scale,
        p[2], p[1],  g[2], g[1],  scale,
        p[2], p[3],  g[2], g[3],  scale ];

    return { vertices : vertices, pos : [ new_pos_x, pos[1] ] };
}



function writeString( string, font, font_metrics, pos, vertex_array, str_pos = 0, array_pos = 0 ) {
    var prev_char = " ";
    var cpos      = pos;
    var x_max     = 0.0;
    var scale     = font_metrics.cap_scale;
    
    for(;;) {
        if ( str_pos == string.length ) break;
        var glyph_float_count = 6 * 5;
        if ( array_pos + glyph_float_count >= vertex_array.length ) break;
        
        var schar = string[ str_pos ];
        str_pos++;
        
        if ( schar == "\n" ) {
            if ( cpos[0] > x_max ) x_max = cpos[0];
            cpos[0]  = pos[0];                      
            cpos[1] -= font_metrics.line_height;
            prev_char = " ";
            continue;
        }

        if ( schar == " " ) {
            cpos[0] += font.space_advance * scale; 
            prev_char = " ";
            continue;
        }

        var font_char = font.chars[ schar ];
        if ( !font_char ) {
            schar = "?";
            font_char = font.chars[ "?" ];
        }

        var kern = font.kern[ prev_char + schar ];
        if ( !kern ) kern = 0.0;

        var rect = charRect( cpos, font, font_metrics, font_char, kern );
        
        for ( var i = 0; i < rect.vertices.length; ++i ) {
            vertex_array[ array_pos ] = rect.vertices[i];
            array_pos++;
        }

        prev_char = schar;
        cpos = rect.pos;
    }
    
    var res = {
        rect : [ pos[0], pos[1], x_max - pos[0], pos[1] - cpos[1] + font_metrics.line_height ],
        string_pos : str_pos,
        array_pos : array_pos
    }

    return res;
}

