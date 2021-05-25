// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const request = require('request-promise');
const {google} = require('googleapis');

const BASE_ENDPOINT = 'recommender.googleapis.com/v1beta1';

/**
 * @private
 * Get an access token for calling Google Cloud APIs
 * @return {string} bearer token or empty string if no token is available
 */
const getToken = async () => {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const authClient = await auth.getClient();
  const token = (await authClient.getAccessToken())?.token || '';
  return token;
};

/**
 * Gets the latest recommendation and etag
 * @param {string} name Recommendation ID
 * @return {object} Recommendation object
 */
const getCurrentVersion = async (name) => {
  const token = await getToken();

  const result = await request({
    uri: `https://${BASE_ENDPOINT}/${name}`,
    headers: {
      'x-goog-user-project': name.split('/')[1],
      'Authorization': `Bearer ${token}`,
    },
    method: 'GET',
  });

  console.log('Recommender getCurrentVersion', result);

  return JSON.parse(result);
};

/**
 * Sets the status of the recommendation
 * @param {string} name Recommendation ID
 * @param {string} etag Fingerprint of the recommendation
 * @param {string} status Recommendation new state
 */
const setStatus = async (name, etag, status) => {
  const token = await getToken();

  const result = await request({
    uri: `https://${BASE_ENDPOINT}/${name}:${status}`,
    headers: {
      'x-goog-user-project': name.split('/')[1],
      'Authorization': `Bearer ${token}`,
    },
    method: 'POST',
    json: {
      etag: etag,
    },
  });

  console.log(result);
};

module.exports = {
  getCurrentVersion,
  setStatus,
};
