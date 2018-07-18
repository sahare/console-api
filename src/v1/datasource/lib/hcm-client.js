/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 ****************************************************************************** */

import _ from 'lodash';
import request from './request';
import config from '../../../../config';
import getToken from './util';
import { GenericError } from './errors';

const hcmUrl = config.get('hcmUrl') || 'http://localhost:8080';

const HCM_POLL_INTERVAL = config.get('hcmPollInterval') || 200;
const HCM_POLL_TIMEOUT = config.get('hcmPollTimeout') || 10000;

export const timeout = ms => new Promise((resolve, reject) => {
  setTimeout(() => reject(new Error('Request Timed Out')), ms);
});

const mergeOpts = (defaultOpts, ...overrides) => Object.assign({}, defaultOpts, ...overrides);

const workDefaults = {
  SrcClusters: { Names: null, Labels: null, Status: null },
  DstClusters: { Names: ['*'], Labels: null, Status: ['healthy'] },
  ClientID: '',
  Dryrun: false,
  Completed: false,
  UUID: '',
  Operation: 'get',
  Work: {
    Namespaces: '', Status: '', Labels: null, Names: '',
  },
  Timestamp: new Date(),
  NextRequest: null,
  FinishedRequest: null,
  Description: '',
};

const getWorkOptions = mergeOpts.bind(null, workDefaults);

const transformResource = (clusterName, resource, resourceName) => ({
  ...resource,
  name: resourceName,
  cluster: clusterName,
});

const transform = (clusterName, resources) =>
  _.reduce(
    resources,
    (transformed, resource, resourceName) => {
      transformed.push(transformResource(clusterName, resource, resourceName));
      return transformed;
    },
    [],
  );

const clustersToItems = clusterData =>
  _.reduce(
    clusterData,
    (accum, { Results: resources }, clusterName) => {
      // Transform all resources for the cluster
      if (resources.code) {
        accum.push(resources);
      } else {
        transform(clusterName, resources).forEach(resource => accum.push(resource));
      }

      return accum;
    },
    [],
  );

async function pollWork(req, httpOptions) {
  const result = await request(httpOptions).then(res => res.body);
  if (result.Error) {
    throw new GenericError({ data: result.Error });
  }
  const workID = result.RetString;

  let intervalID;
  const timeoutPromise = new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      clearInterval(intervalID);
      clearTimeout(id);
      reject(new GenericError({ data: { error: 'Manager request timed out' } }));
    }, HCM_POLL_TIMEOUT);
  });

  const poll = new Promise(async (resolve, reject) => {
    const pollOptions = {
      url: `${hcmUrl}/api/v1alpha1/work/${workID}`,
      headers: {
        Authorization: await getToken(req),
      },
      method: 'GET',
    };
    intervalID = setInterval(async () => {
      const workResult = await request(pollOptions)
        .then(res => res.body);
      const hcmBody = JSON.parse(workResult.RetString);
      if (hcmBody.Result.Completed) {
        clearInterval(intervalID);
        clearTimeout(timeoutPromise);

        const res = hcmBody.Result.Results;
        // TODO: Need a better error handler. May need to enhance the API to return an error field.
        if (res.code || res.message) {
          reject(res);
        } else {
          const items = clustersToItems(res);
          resolve(items);
        }
      }
    }, HCM_POLL_INTERVAL);
  });

  return Promise.race([timeoutPromise, poll]);
}

export async function getWork(req, type, opts) {
  const options = {
    url: `${hcmUrl}/api/v1alpha1/work`,
    headers: {
      Authorization: await getToken(req),
    },
    method: 'POST',
    json: getWorkOptions({ Resource: type }, opts),
  };
  return pollWork(req, options);
}

export async function search(req, type, name, opts = {}) {
  const options = {
    url: `${hcmUrl}/api/v1alpha1/${type}/${name}`,
    headers: {
      Authorization: await getToken(req),
    },
    json: mergeOpts(
      {
        Names: ['*'],
        Labels: null,
        Status: ['healthy'],
        User: '',
        Resource: 'repo',
        Operation: 'search',
        ID: name,
        Action: {
          Name: name,
          URL: '',
        },
      },
      opts,
    ),
    method: 'GET',
  };

  return Promise.race([request(options)
    .then(res => JSON.parse(res.body.RetString).Result), timeout(HCM_POLL_TIMEOUT)]);
}