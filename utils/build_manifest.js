var fs = require('fs');
var path = require('path');
var process = require("process");
var pluginParser = require('./pluginParser');

var repository_dir = "./repository";
var collections_dir = "./collections";
var manifest_path = "./manifest.imjoy.json"
var repo_version = "0.2.0"
var uri_root = "https://raw.githubusercontent.com/oeway/ImJoy-Demo-Plugins/master/repository"
var repo_name = "ImJoy Repository"
var repo_description = "The official plugin repository provided by ImJoy.io."

function parsePlugin(code){
  var pluginComp = pluginParser.parseComponent(code)
  if(pluginComp && pluginComp.config && pluginComp.config.length>0){
    var config = {}
    config = JSON.parse(pluginComp.config[0].content)
    return config;
  }
  else{
    return null;
  }
}

var plugin_configs = [];
// Loop through all the files in the temp directory
fs.readdir(repository_dir, function(err, files) {
  if (err) {
    console.error("Could not list the directory.", err);
    process.exit(1);
  }
  files.forEach(function(file, index) {
    var plugin_path = path.join(repository_dir, file);
    if (plugin_path.endsWith(".imjoy.html")){
        // console.log("reading '%s'...", plugin_path);
        var code = fs.readFileSync(plugin_path, "utf8");
        var config = parsePlugin(code);
        config.uri = file;
        plugin_configs.push(config);
        console.log('Adding plugin ====>', config.name);
    }

  });

  var collection_configs = [];
  // Loop through all the files in the temp directory
  fs.readdir(collections_dir, function(err, files) {
    if (err) {
      console.error("Could not list the directory.", err);
      process.exit(1);
    }
    files.forEach(function(file, index) {
      var collection_path = path.join(collections_dir, file);
      if (collection_path.endsWith(".json")){
          // console.log("reading '%s'...", plugin_path);
          var coll = fs.readFileSync(collection_path, "utf8");
          coll = JSON.parse(coll);
          coll.plugins.forEach(function(p, i) {
            var dep = p.split(":");
            var ps = plugin_configs.filter(function(plugin) { return plugin.name == dep[0] })
            if(ps.length != 1){
              throw "Plugin does not exits in the repository: '" + dep[0] + "' plugin from " + collection_path
            }
          })
          collection_configs.push(coll);
          console.log('Adding collection ====>', coll.name);
      }

    });

    if(plugin_configs.length>0){
      console.log("Writing %s plugins into '%s'", plugin_configs.length, manifest_path);
      var repo_manifest = {name: repo_name, description: repo_description, version: repo_version, uri_root: uri_root, plugins: plugin_configs, collections: collection_configs}
      var stream = fs.createWriteStream(manifest_path);
      stream.once('open', function(fd) {
        stream.write(JSON.stringify(repo_manifest,null,' '));
        stream.end();
      });
      console.log("manifest file updated!");
    }
    else{
      console.error('no plugin found.');
    }
  });

});
