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

const {PubSub} = require('@google-cloud/pubsub');

const TOPIC_NAME = 'activeassist-recommendations';

const pubsub = new PubSub({
  projectId: process.env.RECO_PIPELINE_PROJECT_ID,
});

/**
 * Publish a message to a Pub/Sub topic
 * @param {object} message message to publish
 */
const publish = async (message) => {
  await pubsub.topic(TOPIC_NAME).publishJSON(message);
  console.log('Published');
};

module.exports = {
  publish,
};
