import { GatsbyConfig } from 'gatsby';

const config: GatsbyConfig = {
  // This is required to make use of the React 17+ JSX transform.
  jsxRuntime: 'automatic',

  pathPrefix: process.env.GATSBY_PATH_PREFIX ?? '/',

  plugins: [
    'gatsby-plugin-svgr',
    'gatsby-plugin-styled-components',
    {
      resolve: 'gatsby-plugin-manifest',
      options: {
        name: 'SmartHub',
        icon: 'src/assets/logo.svg',
        theme_color: '#8093ff',
        background_color: '#FFFFFF',
        display: 'standalone',
      },
    },
  ],
};

export default config;
