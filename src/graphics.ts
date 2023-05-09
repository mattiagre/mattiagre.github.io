import * as THREE from 'three';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer';
import Stats from 'three/examples/jsm/libs/stats.module';

/**
 * Manages the graphics.
 */
export class Graphics {
    /**
     * The rendered scene.
     */
    readonly scene: THREE.Scene;
    /**
     * The camera the user can control. 
     */
    readonly camera: THREE.PerspectiveCamera;
    /**
     * The WebGL renderer.
     */
    readonly renderer: THREE.WebGLRenderer;
    /**
     * The label renderer. Used for 2D labels.
     */
    readonly labelRenderer: CSS2DRenderer;
    readonly stats: Stats;

    /**
     * The texture loader used to load textures into memory.
     */
    static readonly TEXTURE_LOADER: THREE.TextureLoader = new THREE.TextureLoader();
    /**
     * The path to the folder where textures are stored.
     */
    static TEXTURE_FOLDER: string = './textures/';
    /**
     * Initial position of camera in the space.
     */
    static INITIAL_CAMERA_POSITION: THREE.Vector3 = new THREE.Vector3(1, 0.5, 1);

    /**
     * Constructs and appends to the body the renderers' DOM elements and sets an handler to the "resize" window event.
     * @param scale If specified, the scale used by the rendering scene. Each AU will be rendered with that size.
     */
    constructor(scale?: number) {
        // Create a new scene
        this.scene = new THREE.Scene();
        if (scale !== undefined)
            this.scene.scale.multiplyScalar(scale);

        // Create a new perspective camera with 75 FOV and unlimited rendering distance
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1e-3, 100); 
        this.camera.position.copy(Graphics.INITIAL_CAMERA_POSITION);

        // Create a new WebGL renderer and append the canvas to the DOM
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        // Create a new CSS2DRenderer
        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0px';
        document.body.appendChild(this.labelRenderer.domElement);

        // Add the "resize" event
        window.addEventListener('resize', () => {
            // Update camera aspect ratio
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            // Update renderers sizes
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Add a debug grid helper
        this.scene.add(new THREE.GridHelper(60, 150));

        // Add the stats 
        this.stats = new Stats();
        document.body.append(this.stats.dom);
    }

    /**
     * Search and load the specified texture in the `Graphics.TEXTURE_FOLDER` folder.
     * @param name The name of the texture.
     */
    loadTexture(name: string) {
        const texture = Graphics.TEXTURE_LOADER.load(Graphics.TEXTURE_FOLDER + name, undefined, undefined, e => console.error(e.message));
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    /**
     * Changes the scale used by the rendering scene.
     */
    setSceneScale(scale: number) {
        this.camera.scale.set(1, 1, 1).multiplyScalar(scale);
    }

    /**
     * Creates a new `THREE.Mesh<THREE.SphereGeometry>` of spherical form, with the specified radius and texture.
     * @param radius The radius of the model.
     * @param texture The optional texture for the model.
     */
    createBodyModel(radius: number, texture?: THREE.Texture): THREE.Mesh<THREE.SphereGeometry> {
        const geometry = new THREE.SphereGeometry(radius);
        const material = new THREE.MeshBasicMaterial();
        // Add the texture to the material if specified
        if (texture !== undefined) 
            material.map = texture;
        return new THREE.Mesh(geometry, material);
    }  

    /**
     * Calls `.render()` to each object.
     */
    render() {
        this.renderer.render(this.scene, this.camera);
        this.labelRenderer.render(this.scene, this.camera);
        this.stats.update();
    }
}