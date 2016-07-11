import React from 'react';
import ReactDOM from 'react-dom';
import THREE from 'three';

import default_shader from './shaders/main';
import * as default_shader_config from './shaders/main';
import screen_shader from './shaders/screen';

const emptyTexture = new THREE.Texture();

class Viewer {
    constructor(canvas, container) {
        this._frames = [];

        this.container = container;

        this.mouse = null;

        this._clock = new THREE.Clock();

        this._scene = new THREE.Scene();
        this._sceneRTT = new THREE.Scene();

        this.initRenderer(canvas);
        this.initCamera();

        this.initGeometry()

        //   new ResizeSensor(container, this.onWindowResize.bind(this));
        //   this.onWindowResize();
    }

    _getViewportSize() {
        const rect = this.container.getBoundingClientRect();
        return [rect.width, rect.height];
    }

    initRenderer(canvas) {
        this._renderer = new THREE.WebGLRenderer({
            canvas: canvas
        });
        this._renderer.setClearColor(0xffffff, 0);
        this._renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
    }

    initCamera() {
        const [viewWidth, viewHeight] = this._getViewportSize();

        this._camera = new THREE.OrthographicCamera(viewWidth / -2, viewWidth / 2, viewHeight / 2, viewHeight / -2, -10000, 10000);
        this._camera.position.z = 100;

        this._rtTexture1 = new THREE.WebGLRenderTarget(viewWidth, viewHeight, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBFormat
        });

        this._rtTexture2 = new THREE.WebGLRenderTarget(viewWidth, viewHeight, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBFormat
        });
    }

    initGeometry() {
        const plane = new THREE.PlaneGeometry(2, 2);

        this._material = new THREE.ShaderMaterial(default_shader);
        this._sceneRTT.add(new THREE.Mesh(plane, this._material));

        this._materialScreen = new THREE.ShaderMaterial(screen_shader);
        this._scene.add(new THREE.Mesh(plane, this._materialScreen));
    }

    setGif(imageData, options) {
        this._frames = [];
        for (const frame of imageData.frames) {
            const tex = new THREE.Texture(frame.canvas);
            tex.needsUpdate = true;
            this._frames.push(tex);
        }

        this._material.uniforms.frameWeight.value = 1.0 / (imageData.frames.length);
        this._material.uniforms.frameWeight.needsUpdate = true;

        this.setCurrentFrame(0);
    }

    setCurrentFrame(frame) {
        this._currentFrame = frame;
        this.animate();
    }

    setOptions(options) {

    }

    /**
     * Main update function.
     */
    update(delta) {
       this._currentFrame++;
    }

    animate() {
        const delta = this._clock.getDelta();
        this.update(delta);
        this.render(delta);
    }

    render(delta) {
        let source = emptyTexture;
        let dest = this._rtTexture1;

        for (let startFrame = this._currentFrame; startFrame < this._frames.length; startFrame += default_shader_config.arraySize) {
            const textures = [];
            for (let i = startFrame; i < startFrame + default_shader_config.arraySize && i < this._frames.length; ++i) {
                const tex = this._frames[i % this._frames.length];
                textures.push(tex);
            }
            this._material.uniforms.frames.value = textures
            this._material.uniforms.frames.needsUpdate = true;

            this._material.uniforms.sourceTexture.value = source
            this._material.uniforms.sourceTexture.needsUpdate = true;
            
            this._renderer.render(this._sceneRTT, this._camera, dest, true);

            source = dest;
            dest = dest === this._rtTexture1 ? this._rtTexture2 : this._rtTexture1; 
        }

        this._materialScreen.uniforms.tDiffuse.value = source;
        this._materialScreen.uniforms.tDiffuse.needsUpdate = true;

        this._renderer.render(this._scene, this._camera);
    }
}


/**
 * Renders a scanlined gif. 
 */
export default class GifRenderer extends React.Component {
    componentDidMount() {
        this._container = ReactDOM.findDOMNode(this);
        this._canvas = this._container.getElementsByClassName('gif-canvas')[0];
        this._renderer = new Viewer(this._canvas, this._container);

        this.drawGifForOptions(this.props.imageData);
    }

    componentWillReceiveProps(newProps) {
        if (this.props.imageData !== newProps.imageData) {
            this.drawGifForOptions(newProps.imageData);
        }
        if (this.props.currentFrame !== newProps.currentFrame) {
            this._renderer.setCurrentFrame(newProps.currentFrame);
        }
    }

    drawGifForOptions(imageData) {
        if (imageData) {
            this._renderer.setGif(imageData);
        }
    }

    render() {
        return (
            <div>
                <canvas className="gif-canvas" width="500" height="300" />
            </div>
        );
    }
};