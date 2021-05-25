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

const {Firestore} = require('@google-cloud/firestore');

const firestore = new Firestore({
  projectId: process.env.RECO_PIPELINE_PROJECT_ID,
});

const RULES_COLLECTION = 'activeassist-business-rules';

/**
 * @private
 * Get list of rules for the recommendations rule engine
 * @param {string} project Project number
 * @param {string} type Recommendation type
 * @param {string} subType Recommendation sub-type
 * @return {object[]} Array of rule document
 */
const getRules = async (project, type, subType) => {
  const collection = firestore.collection(RULES_COLLECTION);

  // const querySnapshot = await collection.get()
  const querySnapshot =
    await collection
        .where('projectNumber', '==', project)
        .where('recommenderType', '==', type)
        .where('recommenderSubtype', '==', subType).get();

  if (querySnapshot) {
    return querySnapshot.docs.map((doc) => doc.data());
  }

  return [];
};

/**
 * Get list of rules for the recommendations rule engine
 * @param {object} payload Project number
 * @return {object[]} Array of rule document
 */
const applyRules = async (payload) => {
  const projectNumber = payload.name.split('/')[1];
  const type = payload.name.split('/')[5];
  const subType = payload.recommenderSubtype;
  const rules = await getRules(projectNumber, type, subType);

  return rules.length == 0 ? null : rules[0];
};

module.exports = {
  applyRules,
};
