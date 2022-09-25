var do_update = true;

function update_text() {
    do_update = true;
}
function glMain() {


    var fonts_select = document.getElementById("fonts");
    fonts_select.addEventListener('input', update_text, false);
    fonts_select.onchange = update_text;

    var font_size_input = document.getElementById("font_size");
    font_size_input.addEventListener('input', update_text, false);
    font_size_input.onchange = update_text;

    var font_color_input = document.getElementById("font_color");
    font_color_input.addEventListener('input', update_text, false);
    font_color_input.onchange = update_text;

    var bg_color_input = document.getElementById("background_color");
    bg_color_input.addEventListener('input', update_text, false);
    bg_color_input.onchange = update_text;

    var textarea = document.getElementById("text");
    textarea.value = `Lorem Ipsum is simply dummy text of the printing and typesetting industry. 
Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, 
when an unknown printer took a galley of type and scrambled it to make a type specimen book. 
It has survived not only five centuries, 
but also the leap into electronic typesetting, remaining essentially unchanged. 
It was popularised in the 1960s with the release of Letraset sheets containing
Lorem Ipsum passages, 
and more recently with desktop publishing software 
like Aldus PageMaker including versions of Lorem Ipsum.`
    textarea.addEventListener('input', update_text, false);
    textarea.onchange = update_text;

    var font = ubuntu_font;

    // GL stuff
    
    var canvas = document.getElementById('glcanvas');
    var gl = canvas.getContext('experimental-webgl', { premultipliedAlpha: false,  alpha: false  } );
    

    ubuntu_font.tex        = loadTexture( gl, "ubuntu.png", gl.LUMINANCE, false, true );

    
    var attribs = [
        { loc: 0, name : 'pos',      size: 2 },
        { loc: 1, name : 'tex0',     size: 2 },
        { loc: 2, name : 'sdf_size', size: 1 }
    ];
    initAttribs( gl, attribs );


    var vertex_array = new Float32Array( 10000 * 6 * attribs[0].stride / 4 );
    
    var vertex_buffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vertex_buffer );
    gl.bufferData( gl.ARRAY_BUFFER, vertex_array, gl.DYNAMIC_DRAW );
    gl.bindBuffer( gl.ARRAY_BUFFER, null );
    gl.enable( gl.BLEND );

    var prog = createProgram( gl, vertCode, fragCode, attribs );

    var str_res;

    
    var vcount = 0;
    var tex;
    
    var font_hinting = 1.0;
    var subpixel     = 1.0;

    var font_color = [ 0.1, 0.1, 0.1 ];
    var bg_color   = [ 0.9, 0.9, 0.9 ];

    var canvas_width = canvas.clientWidth;
    var canvas_height = canvas.clientHeight;
    var pixel_ratio = window.devicePixelRatio || 1;

    function render() {

        if ( do_update ) {

            font_color = colorFromString( font_color_input.value, [ 0.1, 0.1, 0.1 ] );
            bg_color   = colorFromString( bg_color_input.value,   [ 0.9, 0.9, 0.9 ] );
            
            font = ubuntu_font;
            tex = font.tex;

            var font_size = Math.round( font_size_input.value * pixel_ratio );
            var fmetrics = fontMetrics( font, font_size, font_size * 0.2 );
            
            str_res = writeString( textarea.value, font, fmetrics, [0,0], vertex_array );
            vcount = str_res.array_pos / ( attribs[0].stride / 4 /*size of float*/ );

            gl.bindBuffer( gl.ARRAY_BUFFER, vertex_buffer );
            gl.bufferSubData( gl.ARRAY_BUFFER, 0, vertex_array );
            gl.bindBuffer( gl.ARRAY_BUFFER, null );

            subpixel = 1.0;
            
            do_update = false;
        }

        var new_pixel_ratio = window.devicePixelRatio || 1;

        if ( pixel_ratio != new_pixel_ratio ) {
            do_update = true;
            pixel_ratio = new_pixel_ratio;
        }
        
        var cw = Math.round( pixel_ratio * canvas_width * 0.5 ) * 2.0;
        var ch = Math.round( pixel_ratio * canvas_height * 0.5 ) * 2.0;

        canvas.width = cw;
        canvas.height = ch;

        canvas.style.width  = ( cw / pixel_ratio ) + "px";
        canvas.style.height = ( ch / pixel_ratio ) + "px";


        var dx = Math.round( -0.5 * str_res.rect[2] );
        var dy = Math.round(  0.5 * str_res.rect[3] );

        var ws = 2.0 / cw;
        var hs = 2.0 / ch;

        
        var screen_mat = new Float32Array([
            ws,       0,         0,
            0,        hs,        0,
            dx * ws,  dy * hs,   1
        ]);
        
        // Clearing the canvas
        
        gl.clearColor( bg_color[0], bg_color[1], bg_color[2], 0.0 );
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
        gl.viewport( 0, 0, canvas.width, canvas.height );

        
        gl.useProgram( prog.id );

        prog.font_tex.set( 0 );
        prog.sdf_tex_size.set( tex.image.width, tex.image.height );
        prog.sdf_border_size.set( font.iy );
        prog.transform.setv( screen_mat );
        prog.hint_amount.set( font_hinting );
        prog.font_color.set( font_color[0], font_color[1], font_color[2], 1.0 );
        prog.subpixel_amount.set( subpixel );
        
        gl.activeTexture( gl.TEXTURE0 );
        gl.bindTexture( gl.TEXTURE_2D, tex.id );
        
        gl.bindBuffer( gl.ARRAY_BUFFER, vertex_buffer );
        bindAttribs( gl, attribs );

        if ( subpixel == 1.0 ) {

            gl.blendColor( font_color[0], font_color[1], font_color[2], 1.0 );
            gl.blendEquation( gl.FUNC_ADD );
            gl.blendFunc( gl.CONSTANT_COLOR, gl.ONE_MINUS_SRC_COLOR );
        } else {
            gl.blendEquation( gl.FUNC_ADD );
            gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
        }

        gl.drawArrays(gl.TRIANGLES, 0, vcount);
        
        requestAnimationFrame( render );   
    }

    requestAnimationFrame( render );
}
