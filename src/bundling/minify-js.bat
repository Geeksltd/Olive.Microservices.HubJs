@echo off

echo Compiling typescript files ...
call tsc

echo Bundeling ...

@REM call replace-in-file "../../compile/hubEcharts.js" -set "echarts/echarts" "echarts" 
node r.js -o bundle-config.js

echo Replacing content ...
@REM call replace-in-file "../../dist/bundle-built.js" -set "echarts_1.default" "echarts_1" -set "jquery.validate.unobtrusive" "jquery-validate-unobtrusive" -set "jquery-validation" "jquery-validate" -set "define('hub'" "define('app/hub'" -set "../lib/jquery-ui/ui/version" "jquery-ui/ui/version" -set "../lib/echarts/dist/echarts" "echarts/dist/echarts" -set "./hubEcharts" "app/hubEcharts" -set "../lib/jquery-ui/ui/widget" "jquery-ui/ui/widget" -set "../moment" "moment" -set "../compiled/overrides/hubAjaxRedirect" "overrides/hubAjaxRedirect" -set "./overrides/hubAjaxRedirect" "overrides/hubAjaxRedirect" -set "../compiled/overrides/hubForm" "overrides/hubForm" -set "./overrides/hubForm" "overrides/hubForm" -set "../compiled/overrides/hubUrl" "overrides/hubUrl" -set "./overrides/hubUrl" "overrides/hubUrl" -set "popper.js" "popper" -set "define(\"jquery-validate-unobtrusive\", [\"jquery\",\"jquery-validate\"], function(){});" "" -set "./hub" "app/hub" -set """jquery-sortable""" """jquery-ui/ui/widgets/sortable""" -set "'../compiled/" "'app/" -set """../compiled/" """app/" -set "'olive.mvc/dist/" "'olive/" -set """olive.mvc/dist/" """olive/" 
call replace-in-file "echarts_1.default" "echarts_1" "../../dist/bundle-built.js""
call replace-in-file "jquery.validate.unobtrusive" "jquery-validate-unobtrusive"  "../../dist/bundle-built.js" 
call replace-in-file "jquery-validation" "jquery-validate"  "../../dist/bundle-built.js" 
call replace-in-file "define('hub'" "define('app/hub'"  "../../dist/bundle-built.js" 
call replace-in-file "../lib/jquery-ui/ui/version" "jquery-ui/ui/version"  "../../dist/bundle-built.js" 
call replace-in-file "../lib/echarts/dist/echarts" "echarts/dist/echarts"  "../../dist/bundle-built.js" 
call replace-in-file "./hubEcharts" "app/hubEcharts"  "../../dist/bundle-built.js" 
call replace-in-file "../lib/jquery-ui/ui/widget" "jquery-ui/ui/widget"  "../../dist/bundle-built.js" 
call replace-in-file "../moment" "moment"  "../../dist/bundle-built.js" 
call replace-in-file "../compiled/overrides/hubAjaxRedirect" "overrides/hubAjaxRedirect"  "../../dist/bundle-built.js" 
call replace-in-file "./overrides/hubAjaxRedirect" "overrides/hubAjaxRedirect"  "../../dist/bundle-built.js" 
call replace-in-file "../compiled/overrides/hubForm" "overrides/hubForm"  "../../dist/bundle-built.js" 
call replace-in-file "./overrides/hubForm" "overrides/hubForm"  "../../dist/bundle-built.js" 
call replace-in-file "../compiled/overrides/hubUrl" "overrides/hubUrl"  "../../dist/bundle-built.js" 
call replace-in-file "./overrides/hubUrl" "overrides/hubUrl"  "../../dist/bundle-built.js" 
call replace-in-file "popper.js" "popper"  "../../dist/bundle-built.js" 
call replace-in-file "define(\"jquery-validate-unobtrusive\", [\"jquery\",\"jquery-validate\"], function(){});" " " "../../dist/bundle-built.js" 
call replace-in-file "./hub" "app/hub" "../../dist/bundle-built.js" 
call replace-in-file """jquery-sortable""" """jquery-ui/ui/widgets/sortable"""  "../../dist/bundle-built.js" 
call replace-in-file "'../compiled/" "'app/"  "../../dist/bundle-built.js" 
call replace-in-file """../compiled/" """app/"  "../../dist/bundle-built.js" 
call replace-in-file "'olive.mvc/dist/" "'olive/"  "../../dist/bundle-built.js" 
call replace-in-file """olive.mvc/dist/" """olive/"  "../../dist/bundle-built.js" 


echo Apending content ...
type "append-script.js" >> "../../dist/bundle-built.js"

echo Minifying the bundled file ...
call npm install terser -g
call terser ../../dist/bundle-built.js --output ../../dist/bundle-built.min.js --compress --mangle

if ERRORLEVEL 1 (    
	echo ##################################    
    set /p cont= Error occured. Press Enter to exit.
    exit /b -1
)