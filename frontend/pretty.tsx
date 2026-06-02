/* The "pretty" bundle is the Bootstrap-only page shell used by Django
 * templates that only need form styling (mission create, asset add,
 * timeline forms, etc.). Importing page-shell pulls in the Bootstrap
 * bundle (Popper included) and the Bootstrap CSS via esbuild's CSS
 * pipeline, which Django templates then load as pretty.js + pretty.css. */
import './page-shell'
