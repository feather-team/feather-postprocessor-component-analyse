'use strict';

//COMPONENT分析
var COMPONENT_REG = /<!--(?:(?!\[if [^\]]+\]>)[\s\S])*?-->|<\?php\s*\$this->component\(\s*['"]([^'"]+)['"]/ig;
var path = require('path');

module.exports = function(content, file){
    var rules = feather.config.get('template.componentRules'), suffix = feather.config.get('template.suffix');

    return content.replace(COMPONENT_REG, function(all, $1, $2){
        if($1){
            var path = $1;

            rules.forEach(function(rule){
                path = path.replace(rule[0], rule[1]);
            });

            if(path[0] != '/'){
                var tmpFile = path[0] == '.' ? (new feather.file(path.resolve(relative, path))) : feather.file.wrap(path);

                if(path[0] == '.'){
                    tmpFile = (new feather.file(path.resolve(relative, path)));
                }else{
                    path = 'component/' + path;
                    tmpFile = feather.file.wrap(path);
                }

                if(tmpFile.exists()){
                    path = tmpFile.subpath;
                }else{
                    path = '/' + path;
                }
            }else{
                path = '/component' + path;
            }

            path = path.replace(/\/+/, '/').replace(/\.[^\.]+$/, '.' + suffix);

            file.addRequire(path);

            return "<?php $this->load('" + path + "'";
        }

        return all;
    });
};