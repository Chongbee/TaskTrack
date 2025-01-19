import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import path from "path"

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
        adapter: adapter(),
        alias: {
            $lib: path.resolve('./src/lib'),
            $models: path.resolve('./src/models'),
            $src: path.resolve('./src')
        }
    },

	preprocess: [mdsvex(),vitePreprocess()],
	extensions: ['.svelte', '.svx']
};

export default config;
