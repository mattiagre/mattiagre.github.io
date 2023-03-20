/**
 * Defines constants used by the astronomical system of units.
 */
export module AstroSystem {
    /**
     * Meters in an astronomical unit.
     */
    export const AU = 149597870707;
    /**
     * Seconds in a day.
     */
    export const DAY = 86400;
    /**
     * Seconds in a sidereal day.
     */
    export const SIDEREAL_DAY = 86164.0905;
    /**
     * The mass of the Earth (in kg) as revised May 9, 2022, by NASA JPL (https://ssd.jpl.nasa.gov).
     */
    export const EARTH_MASS = 5.97219e24;
    /**
     * The universal gravitational interaction constant in the astronomical system of units.
     */
    export const G_COSTANT = 6.67428e-11 * EARTH_MASS * DAY ** 2 / AU ** 3;
}