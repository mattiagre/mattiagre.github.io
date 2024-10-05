import * as THREE from 'three';
import { AstroSystem } from './astro-system';

/**
 * Represents different types that bodies can be.
 */
export enum BodyType {
    Planet,
    Moon
}

/**
 * Contains useful informations about the rotation of a body.
 */
export class BodyRotation {
    /**
     * The angle (in degrees) that the rotation axis makes with the perpendicular to the ecliptic.
     */
    readonly obliquity: number;
    /**
     * The rotational period, in seconds.
     */
    readonly period: number;
    /**
     * The axis of rotation. Its length is guaranteed to be one. 
     */
    readonly axis: THREE.Vector3;

    /**
     * Constructs a new BodyRotation from the obliquity and the period of the rotation.
     */
    constructor(obliquity: number, period: number) {
        this.obliquity = obliquity;
        this.period = period;
        this.axis = new THREE.Vector3(Math.sin(obliquity * Math.PI / 180), Math.cos(obliquity * Math.PI / 180), 0);
    }
}

/**
 * Represents a 3D body.
 */
export class Body {
    static ORBITS_MAX_VERTEX: number = 1_000;

    /**
     * The name (such as "Sun", "Earth", ...)
     */
    name: string;
    /**
     * The type of the body.
     */
    type: BodyType;
    /**
     * The mass, in terms of `AstroSystem.EARTH_MASS`.
     */
    mass: number;
    /**
     * The radius (in AU) of the body, as viewed as a sphere.
     */
    get radius() {
        return this.model.geometry.parameters.radius;
    }
    /**
     * The 3D model.
     */
    model: THREE.Mesh<THREE.SphereGeometry>;
    /**
     * The 3D line that represents the body's orbit. Can be `undefined`.
     */
    orbit: THREE.Line | undefined;
    /**
     * The position (in AU). Alias of `model.position`.
     */
    get position() {
        return this.model.position;
    }
    /**
     * The velocity (in AU/days).
     */
    readonly velocity: THREE.Vector3;
    /**
     * The acceleration (in AU/days^2).
     */
    readonly acceleration: THREE.Vector3;
    /**
     * The rotation of the body. Can be `undefined`.
     */
    readonly rotation: BodyRotation | undefined;

    /**
     * Constructs a new body with the specified parameters.
     */
    constructor(name: string, type: BodyType, mass: number, model: THREE.Mesh<THREE.SphereGeometry>, position: THREE.Vector3, velocity: THREE.Vector3, orbit?: THREE.Line, rotation?: BodyRotation) {
        this.name = name;
        this.type = type;
        this.mass = mass;
        this.model = model;
        this.position.copy(position);
        this.velocity = new THREE.Vector3().copy(velocity);
        this.acceleration = new THREE.Vector3();
        this.orbit = orbit;
        this.rotation = rotation;
    }

    /**
     * Applies a force to the body, resulting in an acceleration.
     */
    applyForce(force: THREE.Vector3) {
        this.acceleration.add(force.clone().divideScalar(this.mass));
    } 

    /**
     * Rotates the body around its axis for the specified time interval (in days). If `Body.rotation` is `undefined`, this does nothing.
     */
    rotate(interval: number) {
        if (this.rotation === undefined)
            return;
        
        this.model.rotateOnAxis(this.rotation.axis, interval * (AstroSystem.DAY / this.rotation.period) * 2 * Math.PI);
    }

    /**
     * Adds the current position to the orbit, if defined.
     */
    updateOrbit() {
        if (this.orbit === undefined) 
            return;
        const geometry = this.orbit.geometry;

        // Get the previous vertices
        const positionAttribute = geometry.getAttribute('position');
        const positionsArray = positionAttribute.array;

        // Create a new bigger array and add the new position
        const newPositionsArray = new Float32Array(
        positionsArray.length >= Body.ORBITS_MAX_VERTEX * 3 ? Body.ORBITS_MAX_VERTEX  
        * 3 : positionsArray.length + 3);
        if (positionsArray.length >= Body.ORBITS_MAX_VERTEX * 3)
            newPositionsArray.set(Array.from(positionsArray).slice(positionsArray.length - Body.ORBITS_MAX_VERTEX * 3 + 3));
        else
            newPositionsArray.set(positionsArray); 
        newPositionsArray[newPositionsArray.length - 3] = this.position.x;
        newPositionsArray[newPositionsArray.length - 2] = this.position.y;
        newPositionsArray[newPositionsArray.length - 1] = this.position.z;

        // Create a new BufferAttribute with the updated positions array
        const newPositionsAttribute = new THREE.BufferAttribute(newPositionsArray, 3);

        // Set the updated positions attribute to the geometry
        geometry.setAttribute('position', newPositionsAttribute);
    }
}