import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { Body, BodyType, BodyRotation } from './body';
import { AstroSystem } from './astro-system';
import { Graphics } from './graphics';
import { Solver, LeapfrogIntegrator } from './solver';

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

        // Create the solver
        this.solver = new Solver(LeapfrogIntegrator);

        // Create the controls for the camera
        this.cameraControls = new OrbitControls(this.graphics.camera, this.graphics.labelRenderer.domElement);
    }

    loadBodiesFromJSON(path: string) {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", path, true);
        xhr.onload = (_) => {
            // If something occured, display an error
            if (xhr.readyState != 4 || xhr.status != 200) 
                console.error(xhr.statusText);
            // Parse the JSON and add the planets to the array
            JSON.parse(xhr.responseText).forEach((body: any) => {
                // Load the texture
                const texture = this.graphics.loadTexture(body.texture);
                // Create the model for the body
                const rendered_radius = body.radius / (AstroSystem.AU / 30_000);
                const model = this.graphics.createBodyModel(rendered_radius, texture);
                // Add the planet's model to the scene
                this.graphics.scene.add(model);
                // Position and velocity
                const position = new THREE.Vector3(body.position.y, body.position.z, body.position.x);
                const velocity = new THREE.Vector3(body.velocity.y, body.velocity.z, body.velocity.x);
                // Rotation 
                let rotation: BodyRotation;
                if (body.rotation !== undefined) {
                    rotation = new BodyRotation(body.rotation.obliquity, body.rotation.period);
                    model.geometry.applyMatrix4(new THREE.Matrix4().makeRotationZ(-rotation.obliquity * Math.PI / 180));
                }
                // Create the label
                const labelDiv = document.createElement('div');
                labelDiv.className = 'label';
                labelDiv.textContent = body.name;
                const label = new CSS2DObject(labelDiv);
                label.position.set(0, rendered_radius * 1.2, 0);
                model.add(label);
                label.layers.set(0);
                // Add the body 
                this.bodies.push(new Body(body.name, BodyType.Planet, body.mass / AstroSystem.EARTH_MASS, model, position, velocity, rotation));
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
    
    // High resolution clock using for dynamics
    readonly clock = new THREE.Clock(true); 
    // The "animate" routine
    readonly animate = () => {
        this.#requestHandle = window.requestAnimationFrame(this.animate);

        this.graphics.render();
        this.dateDiv.textContent = 'Epoch: ' + addMilliseconds(SolarSystem.INITIAL_DATE, this.solver.elapsedTime).toLocaleString();

        const dt = this.clock.getDelta();
        if (dt !== 0 && dt < 0.1) 
            this.solver.updatePositions(this.bodies, dt / 5);
    }
}

function addMilliseconds(date: Date, milliseconds: number): Date {
    const result = new Date(date);
    result.setMilliseconds(date.getMilliseconds() + milliseconds * 24 * 60 * 60 * 1_000);
    return result;
}