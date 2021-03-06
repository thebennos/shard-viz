// util.js

// Copyright 2012 Phillip Quiza, Andrei Nagornyi

/**
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

/* Given an array of collections and chunks
 * returns the collections array with chunks and shards
 * appended to each collection. The number of chunks is 
 * appended ot each shard
 */

function formatData(collections, shards, chunks) {
  var data = {};
  data.name = "root";
  data.children = [];

  // Count chunks and shards for each collection
  for (var i in collections) {
    if (collections[i].dropped) continue; //skip dropped collections

    var child = {};
    child.name = collections[i]._id;
    child.shards = [];
    child.size = 0;
    
    // Count chunks
    for (var j in chunks) {
      if (child.name == chunks[j].ns) {
        child.size++;
      }
    }

    // Group a collection's shards and chunks
    for (var k in shards) {
      shards[k].chunks = [];
      for (var l in chunks) {
        if (shards[k]._id == chunks[l].shard && chunks[l].ns == child.name) {
           shards[k].chunks.push(chunks[l]);
        }
      }
      if (shards[k].chunks.length > 0) {
        child.shards.push(new clone(shards[k]));
      }
    }
    
    data.children.push(child);
  }

  return data;
}

/* Given the output of treemap(formatData()), return a list of shards to be used 
   for graphing pie charts 
 */
function formatShards(data) {
  var shards = [];
  var pos = 0;
  for (var i in data) {
    if (!data[i].children) {
      var shard = {};
      shard.data = data[i].data;
      shard.x = data[i].x;
      shard.y = data[i].y;
      shard.dx = data[i].dx;
      shard.dy = data[i].dy;

      // add dx and dy to each shard
      for (var j in shard.data.shards) {
        shard.data.shards[j].dx = data[i].dx;
        shard.data.shards[j].dy = data[i].dy;

      }
      shards[pos++] = shard;
    }
  }
  return shards; 
}

function formatShardsData(collections, shards, chunks) {
  var data = [];
  var byShard = _.groupBy(chunks, 'shard');
  var byCollection = _.groupBy(chunks, 'ns'); 
  // Init collections object for each shard
  for (var i in shards) {
    shards[i].collections = {};
    for (var j in collections) {
      shards[i].collections[collections[j]._id] = []; 
    }
  }
  // Insert chunks into each collection in each shard
  for (var i in shards) {
    _.each(shards[i].collections, function (arr, coll) {
      for (var j in byShard[shards[i]._id]) {
	if (byShard[shards[i]._id][j].ns == coll) {
          arr.push(byShard[shards[i]._id][j]);
	}
      }
    });
  }
  return shards;
}

function genChunkKey( ns , min ){
  return clean(JSON.stringify(ns)) + "|" + clean(JSON.stringify(min));
}

function guidGenerator() {
  var S4 = function() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
  };
  return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

/* Returns a value copy of the given object
 */
function clone(source) {
  for (i in source) {
    if (typeof source[i] == 'source') {
      this[i] = new clone(source[i]);
    }
    else{
      this[i] = source[i];
    }
  }
}

// For cleaning up db json objects; Taken from mongo shell source
var clean = function (s) {s = s.replace(/NumberInt\((\-?\d+)\)/g, "$1");return s;};

// Local storage utils
function getPersistedItem(key) {
    var value;
    try { value = window.localStorage.getItem(key);
    } catch(e) { value = null; }
    if (value) return JSON.parse(value);
    return null;
};

function persistItem(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
};

function removeItem(key) { window.localStorage.removeItem(key); };

// vim: set et sw=2 ts=2;