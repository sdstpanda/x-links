# H-links

H-links is a heavily modified fork of [ExLinks](https://github.com/Hupotronic/ExLinks) with many improvements and added features.
It works on Firefox and Chrome to your browsing experience on 4chan and friends more pleasurable.

## Installing

#### For full instructions and information, go to the [proper homepage](https://dnsev-h.github.io/h-links/).

To quickly install, here are the links to the different userscript versions:

* <b>[h-links.user.js](https://raw.githubusercontent.com/dnsev-h/h-links/stable/builds/h-links.user.js)</b> - the standard version of the userscript
* <b>[h-links.debug.user.js](https://raw.githubusercontent.com/dnsev-h/h-links/stable/builds/h-links.debug.user.js)</b> - the debugging version of the userscript<br />
  <i>If you install this version, keep in mind:</i>
  * <i>It <b>will not</b> overwrite the standard version</i>
  * <i>It <b>will not</b> automatically update</i>

## Developing

* Install [Node.js](https://nodejs.org/)
* Clone the repository
* Run `npm install` in the repository directory to install the required modules
* Run `node build.js` to build the userscript
* Run `node build.js dev` for continous builds when relevant script files are updated