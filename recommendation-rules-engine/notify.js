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

const fetch = require("node-fetch");

/**
 * Send a notification to a slack channel containing an Active Assist
 * recommendation information
 * @param {object} recommendation Recommendation
 * @param {string} webhookURL Webhook URL for the Slack channel
 */
const sendNotification = async (recommendation, webhookURL) => {
  const project = recommendation.name.split('/')[1];

  const operationsSections =
    recommendation.content.operationGroups.map(
        (og) => og.operations.map((operation) => (
          {
            'type': 'section',
            'text': {
              'type': 'mrkdwn',
              'text':
`*Role*: ${operation.pathFilters['/iamPolicy/bindings/*/role']} 
*Member*: ${operation.pathFilters['/iamPolicy/bindings/*/members/*']} 
*Action*: ${operation.action}`,
            },
          }
        ))).flat();

  const response = await fetch(
    webhookURL,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        'blocks': [
          {
            'type': 'header',
            'text': {
              'type': 'plain_text',
              'text': `Project ${project}`,
              'emoji': true,
            },
          },
          {
            'type': 'section',
            'text': {
              'type': 'mrkdwn',
              'text': `*Impact*: ${recommendation.primaryImpact.category}`,
            },
          },
          {
            'type': 'section',
            'text': {
              'type': 'mrkdwn',
              'text': recommendation.description,
            },
          },
          ...operationsSections,
        ],
      }),
    })
    .then(req=>req.text());

  console.log('sendNotification', response);
};


module.exports = {
  sendNotification,
};
