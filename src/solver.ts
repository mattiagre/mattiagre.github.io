import { Body } from './body';
import { AstroSystem } from './astro-system';

export type GravityApplierCallback = (bodies: Body[]) => void;

/**
 * A numerical integration method for updating the positions.
 */
export interface Integrator {
    /**
     * Updates the positions of the bodies in the collection using an integration method over a specified time interval.
     * @param bodies The array that contains all the body in the system.
     * @param dt The (sufficently small) time interval, in days.
     */
    updatePositions(bodies: Body[], dt: number): void;
}

class Verlet implements Integrator {
    /**
     * Previous time interval.
     */
    #prevDt: number; 

    constructor(private gravityApplier: GravityApplierCallback) { }

    updatePositions(bodies: Body[], dt: number): void {
        // Initialize the previous time interval
        if (this.#prevDt === undefined)
            this.#prevDt = dt;

        // Apply gravity
        this.gravityApplier(bodies);

        bodies.forEach(body => {
            // Copy the body previous position
            const prevPosition = body.position.clone();
            // Compute the new position
            body.position.add(body.velocity.clone().multiplyScalar(dt)).add(body.acceleration.multiplyScalar(dt * (dt + this.#prevDt) / 2));
            // Update the velocity
            body.velocity.copy(prevPosition.sub(body.position).divideScalar(-dt));
            // Set the acceleration back to zero
            body.acceleration.set(0, 0, 0);
        });

        // Update the previous time interval
        this.#prevDt = dt;
    }
}

class Leapfrog implements Integrator {
    constructor(private gravityApplier: GravityApplierCallback) { }

    updatePositions(bodies: Body[], dt: number): void {
        // Apply gravity
        this.gravityApplier(bodies);

        // Compute v_{i + 1/2} and x_{i + 1}
        bodies.forEach(body => {
            body.velocity.add(body.acceleration.multiplyScalar(dt / 2));
            body.position.add(body.velocity.clone().multiplyScalar(dt));
            // Set the acceleration to zero
            body.acceleration.set(0, 0, 0);
        });

        // Apply gravity for the second time
        this.gravityApplier(bodies);

        // Compute v_{i + 1}
        bodies.forEach(body => {
            body.velocity.add(body.acceleration.multiplyScalar(dt / 2));
            // Set the acceleration to zero
            body.acceleration.set(0, 0, 0);
        });
    }
}

class Yoshida implements Integrator {

    static readonly X0 = -Math.cbrt(2) / (2 - Math.cbrt(2));
    static readonly X1 = 1 / (2 - Math.cbrt(2));
    static readonly C1 = this.X1 / 2;
    static readonly C2 = (this.X0 + this.X1) / 2;
    static readonly C3 = this.C2;
    static readonly C4 = this.C1;
    static readonly D1 = this.X1;
    static readonly D2 = this.X0;
    static readonly D3 = this.X1;

    constructor(private gravityApplier: GravityApplierCallback) { }

    updatePositions(bodies: Body[], dt: number): void {
        // First iteration
        bodies.forEach(body => { 
            body.position.add(body.velocity.clone().multiplyScalar(Yoshida.C1 * dt));
        });
        this.gravityApplier(bodies);
        // Second iteration 
        bodies.forEach(body => {
            body.velocity.add(body.acceleration.multiplyScalar(Yoshida.D1 * dt));
            body.acceleration.set(0, 0, 0); 
            body.position.add(body.velocity.clone().multiplyScalar(Yoshida.C2 * dt));
        });
        this.gravityApplier(bodies);
        // Third iteration 
        bodies.forEach(body => {
            body.velocity.add(body.acceleration.multiplyScalar(Yoshida.D2 * dt));
            body.acceleration.set(0, 0, 0);
            body.position.add(body.velocity.clone().multiplyScalar(Yoshida.C3 * dt));
        });
        this.gravityApplier(bodies);
        // Fourth iteration 
        bodies.forEach(body => {
            body.velocity.add(body.acceleration.multiplyScalar(Yoshida.D3 * dt));
            body.acceleration.set(0, 0, 0);
            body.position.add(body.velocity.clone().multiplyScalar(Yoshida.C4 * dt));
        });
    }
}

export class Solver {
    /**
     * The integration method.
     */
    integrator: Integrator;
    /**
     * The number of sub-iterations that are made each step.
     */
    nSubIteration: number = 5;
    /**
     * Time elapsed, in days.
     */
    elapsedTime: number = 0;

    constructor(integrator: Integrator) {
        this.integrator = integrator;
    }

    /**
     * Applies the gravitational interaction between the bodies and updates their position and rotation. `nSubIterations` sub-iterations are made, for more accuracy.
     */
    updatePositions(bodies: Body[], dt: number) {
        const subDt = dt / this.nSubIteration;
        for (let i = 0; i < this.nSubIteration; i++) {
            this.integrator.updatePositions(bodies, subDt);
        }
        this.elapsedTime += dt;
    }

    /**
     * Applies the gravitational interaction force with the standard O(n^2) algorithm.
     */
    static applyGravity(bodies: Body[]) {
        for (let i = 0; i < bodies.length; i++) {
            for (let j = i + 1; j < bodies.length; j++) {
                const displacement = bodies[i].position.clone().sub(bodies[j].position);
                if (displacement.lengthSq() === 0)
                    console.error('Two bodies have the same position. Cannot compute the force between them.'); 
                const force = displacement.divideScalar(Math.pow(displacement.lengthSq(), 1.5)).multiplyScalar(- AstroSystem.G_COSTANT * bodies[i].mass * bodies[j].mass);
                bodies[i].applyForce(force);
                bodies[j].applyForce(force.negate());
            }
        }
    }
}

/**
 * Uses the Stormer-Verlet method, with a local truncation error of O(dt^4), but global O(dt^2) error. Supports changing time interval.
 */
export const VERLET_INTEGRATOR: Integrator = new Verlet(Solver.applyGravity);
/**
 * Uses the Leapfrog method, with a global O(dt^2) error. Its symplectic nature keeps the mechanical energy constant.
 */
export const LEAPFROG_INTEGRATOR: Integrator = new Leapfrog(Solver.applyGravity);
/**
 * Uses the fourth order simplectic integrator by Prof. Haruo Yoshida.
 */
export const YOSHIDA_INTEGRATOR: Integrator = new Yoshida(Solver.applyGravity);