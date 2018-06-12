/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 ****************************************************************************** */

import { merge } from 'lodash';
import { topologyResolver } from './topology-type';
import { applicationResolver } from './application-type';
import { clusterResolver } from './cluster-type';
import { dashboardResolver } from './dashboard-type';
import { podResolver } from './pod-type';
import { nodeResolver } from './node-type';
import { pvResolver } from './pv-type';
import { namespaceResolver } from './namespace-type';
import { helmRelResolver } from './helmrel-type';
import { helmChartResolver } from './helmchart-type';
import { helmRepoResolver } from './helmrepo-type';

export const typeDef = `
# **Hybrid Cluster Manager**
#
# Root Query
type Query {  
  # List applications registered in HCM.
  applications: [Application]

  # List helm charts.
  charts: [HelmChart]

  # List clusters registered in HCM.
  clusters: [Cluster]

  # Gather the data needed to populate the dashboard.
  dashboard: DashboardData

  # List labels from all clusters registered in HCM.
  labels: [Label]

  # List namespaces from all clusters registered in HCM.
  namespaces: [Namespace]

  # List nodes from all clusters registered in HCM.
  nodes: [Node]

  # List pods from all clusters registered in HCM.
  pods: [Pod]

  # List persistent volumes from all clusters registered in HCM.
  pvs: [PV]

  # List Helm releases from all clusters registered in HCM.
  releases: [HelmRel]

  # List Helm repositories registered in HCM.
  repos: [HelmRepo]


  # List all relationships (weave/mongodb)
  relationships: [Relationship]

  # Get the resource matching the given uid. (weave/mongodb)
  resource(uid: String!): Resource

  # List all resource types available for filtering. (weave/mongodb)
  resourceTypes: [String]

  # List resources matching the given filter. (weave/mongodb)
  resources(filter: Filter): [Resource]

  # Get the topology (weave/mongodb)
  topology(filter: Filter): Topology

  # Get the Instance Topology from HCM
  hcmTopology: HCMTopology


}

# Root Mutation
type Mutation {
  installHelmChart(input: InstallHelmChartInput): [HelmChartResponse]
  deleteHelmRelease(input: DeleteHelmReleaseInput): [HelmChartResponse]
  deleteHelmRepository(input: DeleteHelmRepositoryInput): HelmRepo
  setHelmRepo(input: HelmRepoInput): HelmRepo
}
`;

export const resolver = merge(
  applicationResolver,
  clusterResolver,
  dashboardResolver,
  helmChartResolver,
  helmRepoResolver,
  helmRelResolver,
  nodeResolver,
  podResolver,
  pvResolver,
  namespaceResolver,
  topologyResolver,
);
