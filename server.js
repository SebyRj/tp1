import APIServer from "./APIServer.js";
import RouteRegister from './routeRegister.js';



    RouteRegister.add('GET', 'News', 'list');

    let server = new APIServer();
    server.start();
