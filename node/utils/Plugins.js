/**
 * The Plugins Modul reads the plugin settings out of pluginSettings.json
 * of any plugin in the plugins directory and provides this information to
 * the other modules.
 */

/*
 * 2011 Michael Sievers (University of Paderborn)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var fs = require('fs');

// Traverse the plugin directory to get all plugin names (dirs). 
var pluginDirectories = fs.readdirSync('../plugins/').filter(function(element) {
    return fs.statSync('../plugins/' + element).isDirectory();
});

// TODO: Maybe one should take the plugin names out of the json files.
var pluginNames = pluginDirectories;


// Read the pluginSettings.json for every plugin and store the settings in the plugins array
pluginNames.forEach(function(element) {

  // Read the pluginSettings.json for every plugin and remove all comments
  var pluginSettingsString = fs.readFileSync('../plugins/' + element + '/pluginSettings.json').toString();
  pluginSettingsString = pluginSettingsString.replace(/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+/gm,"").replace(/#.*/g,"").replace(/\/\/.*/g,"");
  
  // Parse json and store the result in the plugins arrays
  try {
    exports[element] = JSON.parse(pluginSettingsString);
  }
  catch(e)
  {
    console.error("There is a syntax error in your settings.json file");
    console.error(e.message);
    process.exit(1);
  }
});

console.log(exports['headings'].isEnabled);