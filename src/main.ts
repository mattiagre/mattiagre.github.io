import './style.css';

import { SolarSystem } from './solar-system';

const solarSystem = new SolarSystem('stars.jpeg');
solarSystem.loadBodiesFromJSON('./bodies.json');
solarSystem.startAnimating();