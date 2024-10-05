import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { Body, BodyType, BodyRotation } from './body';
import { AstroSystem } from './astro-system';
import { Graphics } from './graphics';
import { Solver, VERLET_INTEGRATOR, LEAPFROG_INTEGRATOR, YOSHIDA_INTEGRATOR } from './solver';
import * as Dat from 'dat.gui';

/**
 * A Solar System simulation.
 */
export class SolarSystem {
    /**
     * The object that manages graphics.
     */
    readonly graphics: Graphics;
    /**
     * The DOM element that contains the current date.
     */
    readonly dateDiv: HTMLElement;
    /**
     * The controls for the camera.
     */
    readonly cameraControls: OrbitControls;
    /**
     * List of planets that the Solar System contains.
     */
    readonly bodies: Body[] = [];
    /**
     * Solver.
     */
    readonly solver: Solver;
    /**
     * GUI.
     */
    readonly gui: Dat.GUI;
    /**
     * Controls used by the GUI.
     */
    #guiControls = {
        running: true,
        speed: '1x',
        integrator: 'Yoshida',
        orbitsDensity: 1
    }
    #cameraTarget: THREE.Object3D = undefined;

    /**
     * Initial date used in the simulation.
     */
    static readonly INITIAL_DATE: Date = new Date(2000, 0, 1, 12, 0, 0);

    /**
     * Constructs a new Solar System, adding the renderer's DOM element to the body and an handler that changes the renderer size and camera aspect ratio when an onResize event is triggered.
     * @param background If specified, the name of the texture that will be used as background for the scene.
     */
    constructor(background?: string) {
        this.graphics = new Graphics();

        // Add the background texture if requested
        if (background !== undefined)
            this.graphics.scene.background = this.graphics.loadTexture(background);

        // Create the date div
        this.dateDiv = document.createElement('div');
        this.dateDiv.id = 'date';
        this.dateDiv.textContent = 'Epoch: ' + SolarSystem.INITIAL_DATE.toLocaleString();
        document.body.appendChild(this.dateDiv);

        // Create the solver (default: Yoshida)
        this.solver = new Solver(YOSHIDA_INTEGRATOR);

        // Create the controls for the camera
        this.cameraControls = new OrbitControls(this.graphics.camera, this.graphics.labelRenderer.domElement);

        // Add the gui to the dom
        this.gui = new Dat.GUI();
        const simulationFolder = this.gui.addFolder('Simulation');
        simulationFolder.add(this.#guiControls, 'running').name('Running');
        simulationFolder.add(this.#guiControls, 'speed', ['-1x', '0.25x', '0.5x', '1x', '2x', '4x', '10x']).name('Speed');
        simulationFolder.add(this.#guiControls, 'integrator', ['Verlet', 'LeapFrog', 'Yoshida']).name('Integrator');
        simulationFolder.add(this.solver, 'nSubIteration', 1, 10, 1).name('Sub iterations');
        const orbitsFolder = this.gui.addFolder('Orbits');
        orbitsFolder.add(this.#guiControls, 'orbitsDensity', 0.1, 1).name('Density');
        orbitsFolder.add(Body, 'ORBITS_MAX_VERTEX', 100, 10_000, 10).name('Max vertex');

        // Add the click event listener. If the user clicks on a planet, is will be chosen as the camera target.
        const rendererDom = this.graphics.labelRenderer.domElement;
        rendererDom.addEventListener('click', event => {
            const mouse = new THREE.Vector2(
                (event.clientX / rendererDom.clientWidth) * 2 - 1, 
                -(event.clientY / rendererDom.clientHeight) * 2 + 1
            );
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, this.graphics.camera);
            const intersects = raycaster.intersectObjects(this.bodies.map(body => body.model));
            if (intersects.length > 0) 
                this.#cameraTarget = intersects[0].object;
        });
    }

    /**
     * Loades the bodies (planets, moons, ecc...) from a JSON file.
     * @param path The path to the file.
     */
    loadBodiesFromJSON(path: string) {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", path, true);
        xhr.onload = (_) => {
            // If something occured, display an error
            if (xhr.readyState != 4 || xhr.status != 200) 
                console.error(xhr.statusText);
            // Parse the JSON and add the planets to the array
            JSON.parse(xhr.responseText).forEach((bodyNode: any) => {
                // Load the texture
                const texture = this.graphics.loadTexture(bodyNode.texture);
                // Create the model for the body
                const rendered_radius = bodyNode.radius / (AstroSystem.AU / 30_000);
                const model = this.graphics.createBodyModel(rendered_radius, texture);
                model.renderOrder = 999;
                // Add the planet's model to the scene
                this.graphics.scene.add(model);
                // Position and velocity
                const position = new THREE.Vector3(bodyNode.position.y, bodyNode.position.z, bodyNode.position.x);
                const velocity = new THREE.Vector3(bodyNode.velocity.y, bodyNode.velocity.z, bodyNode.velocity.x);
                // Orbit 
                let orbit: THREE.Line = undefined;
                if (bodyNode.orbit !== undefined) {
                    orbit = this.graphics.createOrbitLine(position, parseInt(bodyNode.orbit.color), bodyNode.orbit.thickness);
                    if (orbit !== undefined) {
                        this.graphics.scene.add(orbit);
                    }
                }
                // Rotation 
                let rotation: BodyRotation;
                if (bodyNode.rotation !== undefined) {
                    rotation = new BodyRotation(bodyNode.rotation.obliquity, bodyNode.rotation.period);
                    model.geometry.applyMatrix4(new THREE.Matrix4().makeRotationZ(-rotation.obliquity * Math.PI / 180));
                }
                // Create the label
                const labelDiv = document.createElement('div');
                labelDiv.className = 'label';
                labelDiv.textContent = bodyNode.name;
                const label = new CSS2DObject(labelDiv);
                label.position.set(0, rendered_radius * 1.2, 0);
                model.add(label);
                label.layers.set(0);
                // Add the body 
                this.bodies.push(new Body(bodyNode.name, BodyType.Planet, bodyNode.mass / AstroSystem.EARTH_MASS, model, position, velocity, orbit, rotation));
            });
        }
        xhr.send(null);
    }

    #requestHandle: number;

    /**
     * Starts animating the Solar System.
     */
    startAnimating() {
        this.#requestHandle = window.requestAnimationFrame(this.animate);
    }

    /**
     * Stops animating the Solar System.
     */
    stopAnimating() {
        window.cancelAnimationFrame(this.#requestHandle);
    }
    
    #lastOrbitUpdate = 0;
    // High resolution clock using for dynamics
    readonly clock = new THREE.Clock(true); 
    // The "animate" routine
    readonly animate = () => {
        this.#requestHandle = window.requestAnimationFrame(this.animate);

        if (this.#cameraTarget !== undefined) {
            this.cameraControls.target = this.#cameraTarget.position.clone();
            this.cameraControls.update();
        }
        this.graphics.render();
        this.dateDiv.textContent = 'Epoch: ' + addMilliseconds(SolarSystem.INITIAL_DATE, this.solver.elapsedTime).toLocaleString();

        // Change the speed of the simulation
        let multiplier: number;
        switch (this.#guiControls.speed) {
            case '-1x': 
                multiplier = -1;
                break;
            case '0.25x':
                multiplier = 0.25;
                break;
            case '0.5x':
                multiplier = 0.5;
                break;
            case '1x':
                multiplier = 1;
                break;
            case '2x':
                multiplier = 2;
                break;
            case '4x':
                multiplier = 4;
                break;
            case '10x':
                multiplier = 10;
                break;
            default:
                multiplier = 1;
        }
        
        // Change integrator 
        switch (this.#guiControls.integrator) {
            case 'Verlet':
                this.solver.integrator = VERLET_INTEGRATOR;
                break;
            case 'LeapFrog':
                this.solver.integrator = LEAPFROG_INTEGRATOR;
                break;
            case 'Yoshida':
                this.solver.integrator = YOSHIDA_INTEGRATOR;
                break;
            default: 
                this.solver.integrator = YOSHIDA_INTEGRATOR;
        }

        // If the simulation is running, update the objects
        const dt = this.clock.getDelta() * multiplier;
        if (this.#guiControls.running && dt !== 0 && dt < 0.2) {
            this.solver.updatePositions(this.bodies, dt);
            // Rotate the body and update its orbit
            this.bodies.forEach(body => body.rotate(dt));
            if (this.solver.elapsedTime > this.#lastOrbitUpdate + 0.1 / this.#guiControls.orbitsDensity) {
                this.bodies.forEach(body => body.updateOrbit());
                this.#lastOrbitUpdate = this.solver.elapsedTime;
            }
        }   
    }
}

function addMilliseconds(date: Date, milliseconds: number): Date {
    const result = new Date(date);
    result.setMilliseconds(date.getMilliseconds() + milliseconds * 24 * 60 * 60 * 1_000);
    return result;
}