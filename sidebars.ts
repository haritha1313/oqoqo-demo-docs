import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'index',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/installation',
        'getting-started/quickstart',
      ],
    },
    {
      type: 'category',
      label: 'Concepts',
      items: [
        'concepts/pipelines',
        'concepts/tasks',
        'concepts/context',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/connectors',
        'guides/observability',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api/pipeline-reference',
      ],
    },
    {
      type: 'category',
      label: 'Examples',
      items: [
        'examples/rag-pipeline',
      ],
    },
  ],
};

export default sidebars;
