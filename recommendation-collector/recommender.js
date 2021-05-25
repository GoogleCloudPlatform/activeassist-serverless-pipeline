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
const fs = require('fs');
const {google} = require('googleapis');

const BASE_ENDPOINT='recommender.googleapis.com/v1';

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
 * @private
 * Get a list of recommendations for a project
 * @param {string} token Access token
 * @param {string} project Project ID
 * @param {string} location Either 'global' or a Google Cloud region
 * @param {string} recommenderType Recommender type (IAM, VM right-sizing, etc.)
 * @return {object} Recommendations request promise
 */
const getRecommendations =
  async (token, project, location, recommenderType) => {
    const options = {
      // See https://cloud.google.com/recommender/docs/reference/rest/v1/projects.locations.recommenders.recommendations/list
      uri: `https://${BASE_ENDPOINT}/projects/${project}/locations/${location}/recommenders/${recommenderType}/recommendations`,
      headers: {
        'x-goog-user-project': project,
        'Authorization': `Bearer ${token}`,
      },
      json: true,
    };

    return request(options);
  };

/**
 * Get a list of recommendations for multiple
 * projects / locations / recommendation types
 * @param {object} metadata metadata document
 * @return {object[]} Array of recommendation objects
 */
const getAllRecommendations = async (metadata) => {
  const token = await getToken();
  const promises = metadata.reduce((acc, m) => {
    m.locations.forEach((loc) => acc.push(getRecommendations(
        token, m.project, loc, m.recommenderType)));
    return acc;
  }, []);

  const all = await Promise.all(promises);

  return all.filter((e) => e.recommendations).map((e) =>
    e.recommendations).flat();
};

/**
 * Get a list of pre-generated recommendations (stub)
 * from a given json file
 * @return {object[]} Array of recommendation objects
 */
const getAllRecommendationsFromStub = () => new Promise((resolve, reject) => {
  fs.readFile('./stub.json', (err, data) => {
    if (err) {
      reject(err);
      return;
    }

    resolve(JSON.parse(data.toString()));
  });
});

/**
 * Mark each recommendation as claimed
 * @param {object[]} recommendations Array of recommendation objects
 */
const markClaimed = async (recommendations) => {
  const token = await getToken();

  const allRequests = recommendations.map((r) => request({
    uri: `https://${BASE_ENDPOINT}/${r.name}:markClaimed`,
    headers: {
      'x-goog-user-project': r.name.split('/')[1],
      'Authorization': `Bearer ${token}`,
    },
    method: 'POST',
    json: {
      etag: r.etag,
    },
  }));

  const result = await Promise.all(allRequests);
  console.log(result);
};

module.exports = {
  getAllRecommendations,
  getAllRecommendationsFromStub,
  markClaimed,
};
