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
    #prevDt: number; 

    updatePositions(bodies: Body[], dt: number): void {
        // Initialize the previous time interval
        if (this.#prevDt === undefined)
            this.#prevDt = dt;
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
        // Update the time interval
        this.#prevDt = dt;
    }
}

class Leapfrog implements Integrator {
    constructor(private gravityApplier: GravityApplierCallback) { }

    updatePositions(bodies: Body[], dt: number): void {
        // Compute v_{i + 1/2} and x_{i + 1}
        bodies.forEach(body => {
            body.velocity.add(body.acceleration.multiplyScalar(dt / 2));
            body.position.add(body.velocity.clone().multiplyScalar(dt));
            // Set the acceleration to zero
            body.acceleration.set(0, 0, 0);
        });
        // Compute v_{i + 1}
        this.gravityApplier(bodies);
        bodies.forEach(body => {
            body.velocity.add(body.acceleration.multiplyScalar(dt / 2));
            // Set the acceleration to zero
            body.acceleration.set(0, 0, 0);
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
            Solver.applyGravity(bodies);
            this.integrator.updatePositions(bodies, subDt);
        }
        // Rotate the bodies
        bodies.forEach(body => body.rotate(dt));
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
                    console.error('Two planets have the same position. Cannot compute the force between them.'); 
                const force = displacement.divideScalar(Math.pow(displacement.lengthSq(), 1.5)).multiplyScalar(- AstroSystem.G_COSTANT * bodies[i].mass * bodies[j].mass);
                bodies[i].applyForce(force);
                bodies[j].applyForce(force.negate());
            }
        }
    }
}

/**
 * Uses the Stormer-Verlet method, with a local truncation error of O(dt^4), but global O(dt^2) error. Supports variable interval time dt.
 */
export const VerletIntegrator: Integrator = new Verlet();
/**
 * Uses the Leapfrog method, with a global O(dt^2) error. Can go back in time and keeps the mechanical energy constant.
 */
export const LeapfrogIntegrator: Integrator = new Leapfrog(Solver.applyGravity);