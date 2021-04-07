@echo off

echo Compiling typescript files ...
call tsc

echo Bundeling ...
node r.js -o bundle-config.js

echo Replacing content ...
call replace-in-file "../../../dist/bundle-built.js" -set "jquery.validate.unobtrusive" "jquery-validate-unobtrusive" -set "jquery-validation" "jquery-validate" -set "define('hub'" "define('app/hub'" -set "../lib/jquery-ui/ui/version" "jquery-ui/ui/version" -set "../lib/jquery-ui/ui/widget" "jquery-ui/ui/widget" -set "../moment" "moment" -set "../scripts/overrides/hubAjaxRedirect" "overrides/hubAjaxRedirect" -set "./overrides/hubAjaxRedirect" "overrides/hubAjaxRedirect" -set "../scripts/overrides/hubForm" "overrides/hubForm" -set "./overrides/hubForm" "overrides/hubForm" -set "../scripts/overrides/hubUrl" "overrides/hubUrl" -set "./overrides/hubUrl" "overrides/hubUrl" -set "popper.js" "popper" -set "define(\"jquery-validate-unobtrusive\", [\"jquery\",\"jquery-validate\"], function(){});" "" -set "./hub" "app/hub" -set """jquery-sortable""" """jquery-ui/ui/widgets/sortable""" -set "'../scripts/" "'app/" -set """../scripts/" """app/" -set "'olive.mvc/dist/" "'olive/" -set """olive.mvc/dist/" """olive/" 



echo Apending content ...
type "append-script.js" >> "../../../dist/bundle-built.js"

echo Minifying the bundled file ...
call npm install terser -g
call terser ../../../dist/bundle-built.js --output ../../../dist/bundle-built.min.js --compress --mangle

if ERRORLEVEL 1 (    
	echo ##################################    
    set /p cont= Error occured. Press Enter to exit.
    exit /b -1
)