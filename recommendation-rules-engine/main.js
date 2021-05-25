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

const express = require('express');
const rules = require('./rules');
const notify = require('./notify');
const recommender = require('./recommender');
const {getIAMPolicy, setIAMPolicy} = require('./iam');

const app = express();

app.use(express.json());

app.listen(process.env.PORT, () => console.log('Rules Engine is running'));

// Receive messages from PubSub
app.post('/process', async (req, res) => {
  try {
    const data = req.body.message.data;
    const payload = JSON.parse(Buffer.from(data, 'base64').toString());

    // Lookup ruleset to check if there are rules for the project,
    // recommender type and subType
    const rule = await rules.applyRules(payload);
    console.log('Matched rule', rule);

    if (rule) {
      if (rule.action == 'Notify') {
        console.log('Matched rule Notify sending notification');
        await notify.sendNotification(payload, rule.slackWebhookURL);
        console.log('Matched rule Notify sent notification');
      } else if (rule.action == 'Apply') {
        console.log('Matched rule Apply');
        const project = payload.name.split('/')[1];

        if (rule.recommenderType == 'google.iam.policy.Recommender') {
          const iamPolicy = await getIAMPolicy(project);
          if (rule.recommenderSubtype == 'REMOVE_ROLE') {
            iamPolicy.bindings = iamPolicy.bindings.map((binding) => {
              payload.content.operationGroups.forEach((og) => {
                og.operations.forEach((operation) => {
                  const role =
                    operation.pathFilters['/iamPolicy/bindings/*/role'];
                  const member =
                    operation.pathFilters['/iamPolicy/bindings/*/members/*'];
                  if (binding.role == role) {
                    binding.members.forEach((m, i) => {
                      if (m == member) {
                        binding.members.splice(i, 1);
                      }
                    });
                  }
                });
              });

              return binding;
            });
          } else {
            // Add additional logic for other types here
          }

          console.log('Setting IAM Policy');
          await setIAMPolicy(project, iamPolicy);

          console.log('Updating recommendation status');
          const currentRecommendation =
            await recommender.getCurrentVersion(payload.name);
          await recommender.setStatus(currentRecommendation.name,
              currentRecommendation.etag, 'markSucceeded');
        } else {
          // Add additional logic for other types here
        }
      }
    } else {
      // TODO: Decide what to do if no rule matches
    }

    res.end();
  } catch (e) {
    console.error(e);
    res.status(500).send(e.toString());
  }
});

