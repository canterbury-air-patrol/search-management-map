/**
 * Shared side-effect imports every browser entrypoint pulls in. Keeps
 * the same set of imports in lockstep across every page-shell bundle
 * so new entries don't have to know which of bootstrap, bootstrap CSS
 * etc. they need to load.
 */
import 'bootstrap/dist/js/bootstrap.bundle'
import 'bootstrap/dist/css/bootstrap.css'
