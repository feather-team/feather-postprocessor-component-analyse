'use strict';

//COMPONENT分析
/*
<?php $this->component(xxx)
<component name="xxx"></component>
<component name="xxx">
<component name="xxx" />
<component>xxx</component>
*/
var COMPONENT_REG = /<!--(?:(?!\[if [^\]]+\]>)[\s\S])*?-->|<\?php\s*\$this->component\(\s*['"]([^'"]+)['"]([\s\S]*?(?:\?>|$))|<component(?: [\s\S]*?name=['"]([^'"]+)['"])?[^>]*>(?:([\s\S]*?)<\/component>)?/ig;
var staticMode = feather.config.get('staticMode'), root = feather.project.getProjectPath();

module.exports = function(content, file){
    var rules = feather.config.get('template.componentRules'), suffix = feather.config.get('template.suffix');

    file.extras.components = [];

    return content.replace(COMPONENT_REG, function(all, $1, $1e, $2, $3){
        var path = $1 || $2 || $3;

        if(path){
            rules.forEach(function(rule){
                path = path.replace(rule[0], rule[1]);
            });

            if(path[0] != '/'){
                var tmpFile;

                if(path[0] == '.'){
                    tmpFile = (new feather.file(require('path').resolve(file.dirname, path)));
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

            if(staticMode){
                var tmpFile = new feather.file(root + path);

                if(tmpFile.exists()){
                    feather.compile(tmpFile);

                    if(tmpFile.cache){
                        file.cache.mergeDeps(tmpFile.cache);
                    }
                    file.cache.addDeps(tmpFile.realpath || tmpFile);

                    return tmpFile.getContent();
                }else{
                    feather.console.warn(file.subpath + ':load ' + path + ' is not exists!');
                    return '';
                }
            }else{
                file.extras.components.push(path);
                return "<?php $this->load('" + path + "'" + ($1e || ');?>');
            }
        }

        return all;
    });
};