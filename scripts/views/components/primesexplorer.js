import { createTextElement } from "./elements.js";
import { createSieveGrid } from "./sievegrid.js";
import { createUlamSpiral } from "./ulamspiral.js";
/** The primes curiosity: the sieve first, then the Ulam spiral. */
export function createPrimesExplorer() {
    const wrapper = createTextElement("div", "", ["curiosity-stack"]);
    wrapper.append(createSieveGrid(), createUlamSpiral());
    return wrapper;
}
