# Using Gulp to Build a Front End Website
A possible version of the gulp-team ti build the front-end of the project is presented in the repository.   So it turned out that I use Gulp as a task-ranner for a long time . Perhaps from the very beginning of its existence. During this time I got my style of writing gulp environment. In this direction, I was influenced by other developers, in particular [Andrew Welch](https://nystudio107.com/blog/a-gulp-workflow-for-frontend-development-automation) with his article of 2015 year. To fulfill the task I decided to follow my rules, as far as they fit the task requirements perfectly. I added comments to me code so that it is clear what I do on each step. In general, my code is not very different from what the absolute majority of developers do to solve similar problems.

I got in a total 9 tasks (main and secondary):
* clean
* scripts
* compile:scss
* styles
* images
* icons
* template
* build
* default

Task *styles* is related to the task *compile:scss*, task *build* is related to the tasks *clean*, *images*, *icons*, *styles*, *scripts*, *template*. These tasks are performed in sequence using npm-package [run-sequence](https://www.npmjs.com/package/run-sequence). Task *default* is relates to the task *build*.

Task *default* runs web server with auto-reload function and starts  and runs two observers for SCSS and JS files. As a web server I used package [gulp-server-livereload](https://www.npmjs.com/package/gulp-server-livereload).

Tu run the project one will need to restore all packages, which I used to build it. This can be done as follows:
```shell
    npm install
```
or any other known way.

In order to build a project, one can do the following:
```shell
    npm run build
```
or
```shell
    gulp build
```
or call for any necessary tasks manually.

To run the web server, one can do the following:
```shell
    npm start
```
or
```shell
    gulp
```

I would like to pay your attention to the fact that I wrote a task to move *index.html* in *dist* folder, with a help of [gulp-useref](https://www.npmjs.com/package/gulp-useref) replaces links to styles and scripts, and also with a help of package [gulp-replace](https://www.npmjs.com/package/gulp-replace) replaces links to images (see comments for details). Also I move icon fonts to *dist/content/icons* folder (I replaces paths in SCSS variables, although this fonts are not used in your layout). Also one of your scripts depends on jQuery, which was not set to your default project. I installed it and included it into my build, although - scripts are not used in your project.

### I hope you will enjoy it. Max Eremin