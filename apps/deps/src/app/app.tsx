import cytoscape from 'cytoscape';
// @ts-ignore
import cytoscapeLayout from 'cytoscape-klay';
import { useEffect, useRef } from 'react';
import styled from 'styled-components';

import data from './data.json';
import { scc } from './scc';

const layout = 'klay';
const ALL_NODES = process.env['NX_ALL_NODES'] === 'true';

const grey = '#ccc';

const distinctColors = [
  '#e6194b',
  '#3cb44b',
  '#ffe119',
  '#4363d8',
  '#f58231',
  '#911eb4',
  '#46f0f0',
  '#f032e6',
  '#bcf60c',
  '#fabebe',
  '#008080',
  '#e6beff',
  '#9a6324',
  '#fffac8',
  '#800000',
  '#aaffc3',
  '#808000',
  '#ffd8b1',
  '#000075',
  '#808080',
  '#ffffff',
  '#000000',
];

interface Component {
  items: string[];
  color: string;
}

const deps = data.graph.dependencies as Record<string, {source: string, target: string}[]>

function getColoredComponents(): Component[] {
  let colorCounter = 0;
  const graph = Object.fromEntries(
    Object.entries(deps).map(([key, targetNodes]) => [key, targetNodes.map((item) => item.target)])
  );
  const components = scc(graph);
  return components.map((items) => {
    return { items, color: items.length > 1 ? distinctColors[colorCounter++] : grey };
  });
}

const components = getColoredComponents();

type ComponentsByNodeEntry = [string, Component];
const componentsByNode = Object.fromEntries(
  components.reduce(
    (acc, component) => [...acc, ...component.items.map((item) => [item, component] as ComponentsByNodeEntry)],
    [] as ComponentsByNodeEntry[]
  )
);

const nodes: any[] = [];
const edges: any[] = [];
for (const [node, nodeEdges] of Object.entries(deps)) {
  if (!ALL_NODES && componentsByNode[node].items.length === 1) continue;
  nodes.push({ group: 'nodes', data: { id: node, name: node } });
  for (const [i, edge] of Object.entries(nodeEdges)) {
    if (!ALL_NODES && componentsByNode[edge.source] !== componentsByNode[edge.target]) continue
      edges.push({ group: 'edges', data: { id: `${node}_${i}`, source: edge.source, target: edge.target } });
  }
}


function getEdgeColor(source: string, target: string) {
  const component = componentsByNode[source];
  if (component.items.includes(target)) {
    return component.color;
  }
  return grey;
}

const StyledApp = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
`;

export function App() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    cytoscape.use(cytoscapeLayout);
    cytoscape({
      container: ref.current,
      boxSelectionEnabled: false,
      autounselectify: true,

      layout: {
        name: layout,
      },

      style: [
        {
          selector: 'node[name]',
          style: {
            content: 'data(name)',
          },
        },
        {
          selector: 'node',
          style: {
            'background-color': function (x: any) {
              return componentsByNode[x.data('name')].color;
            },
          },
        },

        {
          selector: 'edge',
          style: {
            width: 1,
            'target-arrow-shape': 'triangle',

            'line-color': (el: any) => {
              return getEdgeColor(el.source().data('name'), el.target().data('name'));
            },
            'target-arrow-color': (el: any) => {
              return getEdgeColor(el.source().data('name'), el.target().data('name'));
            },
            'curve-style': 'bezier',
          },
        },
      ],

      elements: [
        ...nodes,
        ...edges,
      ],
    } as any);
  });
  return <StyledApp ref={ref}></StyledApp>;
}

export default App;
