/** @type {import('@dhis2/cli-app-scripts').D2Config} */
const config = {
    type: 'app',
    name: 'outbreak-signal-manager',
    title: 'Outbreak Signal Manager',
    description:
        'A control panel for Outbreak Signal Service -- pick or create a DHIS2 Route to it, trigger a sync or detection run, and browse/review the alerts it raises, all from inside DHIS2.',

    minDHIS2Version: '2.40',

    entryPoints: {
        app: './src/App.tsx',
    },

    dataStoreNamespace: 'outbreakSignalManager',

    direction: 'auto',

    // Splits third-party deps (mainly @dhis2/ui) into their own chunk --
    // same fix as dhis2-fhir-sync-console's own d2.config.js, purely build-
    // output cleanliness (silences the "chunk larger than 500kB" warning),
    // no functional change.
    viteConfigExtensions: {
        build: {
            chunkSizeWarningLimit: 800,
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (id.includes('node_modules')) return 'vendor'
                    },
                },
            },
        },
    },
}

module.exports = config
