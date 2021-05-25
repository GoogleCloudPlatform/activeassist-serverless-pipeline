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

const {google} = require('googleapis');
const cloudresourcemanager = google.cloudresourcemanager('v1');

/**
 * Get an initialized GoogleAuth client
 * @return {object} GoogleAuth client
 */
const authorize = async () => {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  return await auth.getClient();
};

/**
 * Get a Google Cloud project's IAM policy
 * @param {string} project Project ID
 * @return {object} The project's IAM policy
 */
const getIAMPolicy = async (project) => {
  const authClient = await authorize();
  const request = {
    resource_: project,
    auth: authClient,
  };

  const response =
    (await cloudresourcemanager.projects.getIamPolicy(request)).data;
  console.log('getIAMPolicy', response);
  return response;
};

/**
 * Sets a Google Cloud project's IAM policy
 * @param {string} project Project ID
 * @param {object} policy IAM policy to be applied to the project
 * @return {object} The project's updated IAM policy
 */
const setIAMPolicy = async (project, policy) => {
  const authClient = await authorize();
  const request = {
    resource_: project,
    resource: {
      policy,
    },
    auth: authClient,
  };

  const response =
    (await cloudresourcemanager.projects.setIamPolicy(request)).data;
  console.log('setIAMPolicy', response);
  return response;
};

module.exports = {
  getIAMPolicy,
  setIAMPolicy,
};
