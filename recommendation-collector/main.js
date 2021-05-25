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
const db = require('./db');
const recommender = require('./recommender');
const publisher = require('./publisher');
const app = express();

app.post('/run', async (req, res) => {
  try {
    // Fetch metadata from Firestore
    const metadata = await db.getMetadata();
    console.log('Fetched metadata');

    // Invokes the Recommender API/s for each project
    let allRecommendations;

    if (!process.env.STUB_RECOMMENDATIONS) {
      allRecommendations = await recommender.getAllRecommendations(metadata);
      console.log('Fetched recommendations from API');
    } else {
      allRecommendations = await recommender.getAllRecommendationsFromStub();
      console.log('Fetched recommendations from Stub');
    }

    // Filter by active recommendations only
    const activeRecommendations = allRecommendations.filter(
        (r) => r.stateInfo.state = 'ACTIVE');
    console.log('activeRecommendations', activeRecommendations);

    // Publish messages to PubSub
    await Promise.all(activeRecommendations.map((r) => publisher.publish(r)));
    console.log('Published recommendations to pub/sub');

    // Mark messages as claimed
    if (!process.env.STUB_RECOMMENDATIONS) {
      await recommender.markClaimed(activeRecommendations);
      console.log('Marked recommendation as claimed');
    }

    res.end();
  } catch (e) {
    console.error(e);
    res.status(500).send(e.toString());
  }
});

app.listen(process.env.PORT, () => console.log('Collector ready'));
