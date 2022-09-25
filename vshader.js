var vertCode = `

attribute vec2  pos;      
attribute vec2  tex0;      
//attribute float sdf_size;   
attribute float scale;

uniform vec2  sdf_tex_size; 
uniform mat3  transform;
uniform float sdf_border_size;

varying vec2  tc0;
varying float doffset;
varying vec2  sdf_texel;
varying float subpixel_offset;

void main(void) {
    float sdf_size = 2.0 * scale * sdf_border_size;
    tc0 = tex0;
    doffset = 1.0 / sdf_size;         
    sdf_texel = 1.0 / sdf_tex_size;
    subpixel_offset = 0.3333 / scale; 

    vec3 screen_pos = transform * vec3( pos, 1.0 );    
    gl_Position = vec4( screen_pos.xy, 0.0, 1.0 );
}
`
