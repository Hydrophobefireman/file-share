import _css from "../css/main.css";
import { Router, applyCSSAsync } from "./router/router.js";
import landingRoute from "./routes/landing-route.js";
import sessionRoute from "./routes/session-route.js";
import { getConnection } from "./ext.js";
applyCSSAsync("https://fonts.googleapis.com/css?family=Open+Sans");
Router.registerRoute(landingRoute);
Router.registerRoute(sessionRoute);
getConnection(Router, false).then(() => Router.startLoad());
