import { GatsbyNode } from 'gatsby';

const onCreateWebpackConfig: GatsbyNode['onCreateWebpackConfig'] = ({
  stage,
  loaders,
  actions,
}) => {
  if (stage === 'build-html' || stage === 'develop-html') {
    actions.setWebpackConfig({
      module: {
        rules: [
          {
            test: /crypto/u, // null-loader package, which allows you to replace certain modules with an empty implementation during webpack bundling.
            use: loaders.null(),
          },
        ],
      },
    });
  }
};

export { onCreateWebpackConfig };
