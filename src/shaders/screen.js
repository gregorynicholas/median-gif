import THREE from 'three';

export default {
    uniforms: {
        flip: { type: 'i', value: 0 },
        tDiffuse: { type: 't' }
    },
    vertexShader: `
        uniform int flip;

        varying vec2 vUv;
        
        void main() {
            if (flip > 0)
                vUv = vec2(uv.s, 1.0 - uv.t);
            else
                vUv = uv;
            gl_Position = vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        
        varying vec2 vUv;

        void main() {
            gl_FragColor =  texture2D(tDiffuse, vUv);
        }
    `
};