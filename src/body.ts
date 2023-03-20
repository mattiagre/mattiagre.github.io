import * as THREE from 'three';
import { AstroSystem } from './astro-system';

/**
 * Represents different types that bodies can be.
 */
export enum BodyType {
    Planet,
    Moon
}

export class BodyRotation {
    readonly obliquity: number;
    readonly period: number;
    readonly axis: THREE.Vector3;

    constructor(obliquity: number, period: number) {
        this.obliquity = obliquity;
        this.period = period;
        this.axis = new THREE.Vector3(Math.sin(obliquity * Math.PI / 180), Math.cos(obliquity * Math.PI / 180), 0).normalize();
    }
}

/**
 * Represents a 3D body.
 */
export class Body {
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
     * The radius (in AU) of the body, as viewed as a sphere.
     */
    set radius(value) {
        this.model.geometry.parameters.radius = value;
    }
    /**
     * The 3D model.
     */
    model: THREE.Mesh<THREE.SphereGeometry>;
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
    readonly rotation: BodyRotation;

    /**
     * Constructs a new body with the specified parameters.
     */
    constructor(name: string, type: BodyType, mass: number, model: THREE.Mesh<THREE.SphereGeometry>, position: THREE.Vector3, velocity: THREE.Vector3, rotation?: BodyRotation) {
        this.name = name;
        this.type = type;
        this.mass = mass;
        this.model = model;
        this.position.copy(position);
        this.velocity = new THREE.Vector3().copy(velocity);
        this.acceleration = new THREE.Vector3();
        this.rotation = rotation;
    }

    /**
     * Applies a force to the body, resulting in an acceleration.
     */
    applyForce(force: THREE.Vector3) {
        this.acceleration.add(force.clone().divideScalar(this.mass));
    } 

    /**
     * Rotates the body around its axis for the specified time interval (in days). If `rotation` is `undefined`, this does nothing.
     */
    rotate(interval: number) {
        if (this.rotation !== undefined)
            this.model.rotateOnAxis(this.rotation.axis, interval * (AstroSystem.DAY / this.rotation.period) * 2 * Math.PI);
    }
}