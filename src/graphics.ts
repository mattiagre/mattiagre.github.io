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
    /**
     * Statistics of the simulation.
     */
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
     * @param scale If specified, the scale used by the rendering scene. Each AU will be rendered with that screen size.
     */
    constructor(scale?: number) {
        // Create a new scene
        this.scene = new THREE.Scene();
        if (scale !== undefined)
            this.scene.scale.multiplyScalar(scale);

        // Create a new perspective camera with 90 FOV
        this.camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 10e-8, 2000); 
        this.camera.position.copy(Graphics.INITIAL_CAMERA_POSITION);

        // Create a new WebGL renderer and append the canvas to the DOM
        this.renderer = new THREE.WebGLRenderer({ antialias: true, precision: 'highp' });
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

        // Add the stats 
        this.stats = new Stats();
        document.body.append(this.stats.dom);
    }

    /**
     * Search and load the specified texture in the `Graphics.TEXTURE_FOLDER` folder.
     * @param name The name of the texture.
     */
    loadTexture(name: string) {
        const texture = Graphics.TEXTURE_LOADER.load(Graphics.TEXTURE_FOLDER + name, undefined, undefined, e => console.error(e));
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    /**
     * Changes the uniform scale used by the rendering scene. 
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
     * Creates and returns a new orbit line in the scene. 
     * @param position Initial position of the line.
     * @param color Color of the line. If not specified, it will be white (`0xFFFFFF`).
     * @param thickness Thickness of the line. If not specified, it will be `1`.
     */
    createOrbitLine(position: THREE.Vector3, color: number = 0xFFFFFF, thickness: number = 1): THREE.Line {
        // Create a new geometry with the specified position as attribute
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([position.x, position.y, position.z]);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        // Define the material of the orbit
        const material = new THREE.LineBasicMaterial( { color: color, linewidth: thickness });
        // Create the orbit line
        const orbit = new THREE.Line(geometry, material);
        orbit.frustumCulled = false;
        return orbit;
    }

    /**
     * Calls `.render()` to each object (`Graphics.renderer`, `Graphics.labelRenderer` and `Graphics.stats`).
     */
    render() {
        this.renderer.render(this.scene, this.camera);
        this.labelRenderer.render(this.scene, this.camera);
        this.stats.update();
    }
}