/**
 * MiniDi — Vietnam Knowledge Graph
 *
 * Thin entry point: imports library + country config.
 */
import { createMiniDiApp } from "@minidi/minidi-data-ghpage";
import config from "./config.js";

createMiniDiApp(config);
