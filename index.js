'use strict';

//COMPONENT分析
/*
<?php $this->component(xxx)
<component name="xxx"></component>
<component name="xxx">
<component name="xxx" />
<component>xxx</component>
*/
var COMPONENT_REG = /<!--(?:(?!\[if [^\]]+\]>)[\s\S])*?-->|(<\?php (?:(?!\?>)[\s\S])*?)\$this->(component|load)\(\s*['"]([^'"]+)['"]([\s\S]*?(?:;|$))|<component(?: [\s\S]*?name=['"]([^'"]+)['"])?[^>]*>(?:([\s\S]*?)<\/component>)?/ig;
var staticMode = feather.config.get('staticMode'), root = feather.project.getProjectPath();

module.exports = function(content, file){
    var rules = feather.config.get('template.componentRules'), suffix = feather.config.get('template.suffix');

    file.extras.components = [];

    return content.replace(COMPONENT_REG, function(all, $1b, $1, $2, $2e, $3, $4){
        if($1 == 'load' && $2){
            file.extras.components.push($2);
        }else{
            var path = $2 || $3 || $4;

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

                        ['headJs', 'bottomJs', 'css'].forEach(function(type){
                            file.extras[type] = (file.extras[type] || []).concat(tmpFile.extras[type]);
                        });

                        return tmpFile.getContent();
                    }else{
                        feather.console.warn(file.subpath + ':load ' + path + ' is not exists!');
                        return '';
                    }
                }else{
                    file.extras.components.push(path);
                    return ($1b || '<?php ') + "$this->load('" + path + "'" + ($2e || ');?>');
                }
            }
        }

        return all;
    });
};